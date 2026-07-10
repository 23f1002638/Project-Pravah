# Project Pravah: Risk Assessment Core

Project Pravah is an automated, real-time logistics risk assessment framework designed to predict shipment delays and recommend immediate operational mitigations. It integrates an offline Machine Learning pipeline with a Generative AI reasoning core.

---

## 1. System Architecture

The application implements a dual-tier analytical structure:
1.  **Machine Learning Inference Pipeline (Python/Flask)**:
    *   **Preprocessor**: Transforms raw transactional telemetry fields.
    *   **Regressor**: Projects the expected deviation in shipment delivery days.
    *   **Classifier**: Forecasts the probability of fulfillment failure (SLA breach).
2.  **Generative AI Reasoning Core (Gemini)**:
    *   Translates ML statistics into high-level operational directives.
    *   Returns customized regional mitigations (e.g., freight interception, express service routing).

---

## 2. Technical Stack

*   **Backend**: Flask, Joblib, Pandas, Google GenAI SDK.
*   **Frontend**: Next.js (App Router), Tailwind CSS v4, Framer Motion, Lucide Icons.

---

## 3. Getting Started

### Backend Setup
1. Activate virtual environment:
   ```bash
   .venv\Scripts\activate
   ```
2. Set environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Run backend server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```
