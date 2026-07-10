import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables from .env files
load_dotenv()
load_dotenv(os.path.expanduser("~/.env"))

app = Flask(__name__)
# Configure CORS to allow cross-origin communication with Next.js frontend
CORS(app)

#Global Initialization
# On application startup, load the three .joblib binary pipeline artifacts into memory globally
try:
    preprocessor = joblib.load('drishti_preprocessor.joblib')
    reg_model = joblib.load('drishti_regressor.joblib')
    cls_model = joblib.load('drishti_classifier.joblib')
    print("Pre-trained models and preprocessor loaded successfully.")
except Exception as e:
    print(f"Error loading model files: {e}")
    raise e

# Initialize and configure the Google Generative AI SDK client using the environment variable GEMINI_API_KEY
gemini_api_key = os.environ.get("GEMINI_API_KEY")
client = None
if gemini_api_key:
    try:
        client = genai.Client(api_key=gemini_api_key)
        print("Google Generative AI SDK client initialized successfully.")
    except Exception as e:
        print(f"Error initializing Google Generative AI SDK client: {e}")
else:
    print("WARNING: GEMINI_API_KEY environment variable is not set. LLM synthesis will fallback.")


def validate_payload(data):
    """
    Validates incoming payload schema and types.
    Returns (is_valid, error_message).
    """
    required_fields = {
        "order_id": (int, str),
        "Shipping Mode": (str,),
        "Order Region": (str,),
        "Customer Segment": (str,),
        "Days for shipment (scheduled)": (int, float),
        "Product Price": (int, float),
        "Order Item Quantity": (int,),
        "Sales": (int, float)
    }

    for field, expected_types in required_fields.items():
        if field not in data:
            return False, f"Missing required field: '{field}'"
        
        val = data[field]
        if not isinstance(val, expected_types):
            return False, f"Invalid type for '{field}'. Expected {expected_types}, got {type(val)}"

    return True, None


@app.route('/api/evaluate-risk', methods=['POST'])
def evaluate_risk():
    # Encapsulate the ingestion and inference tracks inside validation try-except blocks
    try:
        # Data Ingestion
        if not request.is_json:
            return jsonify({
                "status": "error",
                "message": "Content-Type must be application/json"
            }), 400

        data = request.get_json()

        # Schema Validation
        is_valid, error_msg = validate_payload(data)
        if not is_valid:
            # Terminate gracefully with a 400 bad request status and an explicit field error description
            return jsonify({
                "status": "error",
                "message": f"Validation failed: {error_msg}"
            }), 400

        # Machine Learning Inference Pipeline
        # Map the incoming raw payload keys into a single-row Pandas DataFrame ensuring column keys match the training schema configuration exactly
        df_input = pd.DataFrame([{
            "Shipping Mode": data["Shipping Mode"],
            "Customer Segment": data["Customer Segment"],
            "Order Region": data["Order Region"],
            "Days for shipment (scheduled)": int(data["Days for shipment (scheduled)"]),
            "Sales": float(data["Sales"]),
            "Order Item Quantity": int(data["Order Item Quantity"]),
            "Product Price": float(data["Product Price"])
        }])

        # Pass the raw DataFrame row through the loaded preprocessor instance
        X_processed = preprocessor.transform(df_input)

        # Pass the processed array to the loaded regressor model to compute the exact expected delay days
        predicted_deviation = float(reg_model.predict(X_processed)[0])

        # Pass the processed array to the loaded classifier model to calculate the probability of fulfillment failure
        late_probability = float(cls_model.predict_proba(X_processed)[0][1])

    except Exception as inference_error:
        # Terminate gracefully if inference failed
        return jsonify({
            "status": "error",
            "message": f"Machine learning inference pipeline error: {str(inference_error)}"
        }), 500

    ml_metrics = {
        "predicted_deviation_days": predicted_deviation,
        "late_risk_probability": late_probability
    }

    # Amber Agent Reasoning Layer (LLM Synthesis)
    try:
        if not client:
            raise ValueError("Google Generative AI SDK client is not initialized.")

        # Construct the System Instruction prompt template for the Amber core persona
        system_instruction_text = (
            "You are Amber, a senior enterprise supply chain logistics risk officer. "
            "Your task is to translate raw statistical numbers into executive corporate directives. "
            "The response must explicitly state the Predicted Deviation, Late Probability, and the baseline Model MAE (0.9839 days). "
            "Avoid any casual, conversational, or supportive phrasing. "
            "Return exactly two concrete operational mitigation strategies customized to the order's regional nodes and shipping parameters "
            "(e.g., physical freight interception, carrier service level upgrades, or proactive client retention triggers). "
            "Format the response strictly using professional Markdown structures with clean bolding and bulleted blocks."
        )

        # Construct the context dictionary combining the human-readable order elements and the raw statistical evaluations
        user_context = {
            "order_id": data["order_id"],
            "Shipping Mode": data["Shipping Mode"],
            "Order Region": data["Order Region"],
            "Customer Segment": data["Customer Segment"],
            "Days for shipment (scheduled)": data["Days for shipment (scheduled)"],
            "Product Price": data["Product Price"],
            "Order Item Quantity": data["Order Item Quantity"],
            "Sales": data["Sales"],
            "ml_model_outputs": {
                "predicted_deviation_days": predicted_deviation,
                "late_risk_probability": late_probability,
                "model_confidence_mae_days": 0.9839
            }
        }

        # Send the consolidated context payload to the Gemini API with automatic fallback
        import json
        payload_str = json.dumps(user_context, indent=4)
        config = types.GenerateContentConfig(system_instruction=system_instruction_text)

        try:
            print("Attempting generation with gemini-3.5-flash...")
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=payload_str,
                config=config
            )
        except Exception as primary_error:
            print(f"Primary model gemini-3.5-flash failed/unavailable: {primary_error}")
            print("Attempting fallback generation with gemini-3.1-flash-lite...")
            response = client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=payload_str,
                config=config
            )

        if not response.text:
            raise ValueError("Empty response received from the Gemini API.")

        amber_advisory = response.text

        # Dispatch a clean JSON structure back to the frontend dashboard
        return jsonify({
            "status": "success",
            "ml_metrics": ml_metrics,
            "amber_advisory": amber_advisory
        }), 200

    except Exception as llm_error:
        # If remote LLM gateway processing errors occur, capture the exception
        # and return a 500 status alongside a structured JSON fallback advisory
        # detailing that the automated agent reasoning module is temporarily offline
        # while preserving the core machine learning metrics
        print(f"LLM Gateway Error: {llm_error}")
        fallback_advisory = (
            "The automated agent reasoning module is temporarily offline while "
            "the core machine learning metrics are preserved."
        )
        return jsonify({
            "status": "error",
            "ml_metrics": ml_metrics,
            "amber_advisory": fallback_advisory
        }), 500


if __name__ == '__main__':
    # Run the Flask app on localhost
    app.run(host='127.0.0.1', port=5000, debug=True)
