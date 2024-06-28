from fastapi import FastAPI, File, UploadFile
import pandas as pd
import numpy as np
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from io import StringIO

app = FastAPI()

# CORS settings for local development, adjust as per your deployment needs
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to calculate metrics
def calculate_metrics(df):
    metrics = {}

    # Uniqueness on id, phone, and email
    unique_id = df['id'].nunique() / len(df) * 100
    unique_phone = df['Phone_number'].nunique() / len(df) * 100
    unique_email = df['email'].nunique() / len(df) * 100
    metrics["Uniqueness"] = float(np.mean([unique_id, unique_phone, unique_email]))

    # Completeness on phone and email
    completeness_phone = df['Phone_number'].notna().mean() * 100
    completeness_email = df['email'].notna().mean() * 100
    metrics["Completeness"] = float(np.mean([completeness_phone, completeness_email]))

    # Validity and timeliness on date of birth
    current_time = pd.Timestamp.now()
    df['Date_of_birth'] = pd.to_datetime(df['Date_of_birth'], errors='coerce', format='%d/%m/%Y')
    valid_dob = df['Date_of_birth'].notna().mean() * 100
    metrics["Validity"] = float(valid_dob)

    # Timeliness: Example using Date_of_birth, consider younger age as more timely
    age = (current_time - df['Date_of_birth']).dt.total_seconds() / (60 * 60 * 24 * 365)
    max_age = age.max()
    metrics["Timeliness"] = float((100 - age.mean() / max_age * 100) if max_age > 0 else 100)

    # Coherence on state and num_state
    df['num_state'] = df['num_state'].astype(str)
    df['state'] = df['state'].astype(str)
    state_coherence = (df['num_state'] == df['state']).mean() * 100
    metrics["Coherence"] = float(state_coherence)

    # DQ Score as an average of other metrics
    metrics["DQ Score"] = float(np.mean(list(metrics.values())))

    # Processed and failed rows
    processed_rows = int(len(df))
    failed_rows = int(df.isna().any(axis=1).sum())

    return metrics, processed_rows, failed_rows

# FastAPI endpoint to upload CSV and calculate metrics
@app.post("/upload-csv", response_model=dict)
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(StringIO(contents.decode('utf-8')))

    metrics, processed_rows, failed_rows = calculate_metrics(df)

    # Prepare data for CircularProgressbar
    data_progressbar = [{"id": key, "value": value} for key, value in metrics.items()]

    # Prepare data for ResponsiveBar with named rules
    data_chart = [{"id": f"Rule {idx + 1}", "data": [{"x": f"Rule {idx + 1}", "y": value}] } for idx, (key, value) in enumerate(metrics.items())]

    return {
        "metrics": data_progressbar,  # For CircularProgressbar
        "chart_data": data_chart,  # For ResponsiveBar
        "processed_rows": processed_rows,
        "failed_rows": failed_rows
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
