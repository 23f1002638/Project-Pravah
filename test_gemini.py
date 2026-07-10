import os
from google import genai
from dotenv import load_dotenv

# Load env
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
print("Key exists:", bool(api_key))
if api_key:
    print("Key prefix:", api_key[:10])
    print("Key length:", len(api_key))

try:
    client = genai.Client(api_key=api_key)
    print("Sending request to gemini-3.1-flash-lite...")
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents="Hello, this is a test. Reply with 'Success' if you can read this."
    )
    print("Response text:", response.text)
except Exception as e:
    print("Error calling Gemini API:", e)
