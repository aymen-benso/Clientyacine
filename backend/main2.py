from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import json
from io import StringIO


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)


app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_metrics(df):
    metrics = {}

    # Calculate DQ Score as an average of other metrics
    metrics["DQ Score"] = np.random.uniform(0, 100)  # Placeholder

    # Timeliness: Assume we have a 'timestamp' column
    if 'timestamp' in df.columns:
        current_time = pd.Timestamp.now()
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        df['timeliness'] = (current_time - df['timestamp']).dt.total_seconds()
        metrics["Timeliness"] = 100 - df['timeliness'].mean() / \
            df['timeliness'].max() * 100
    else:
        metrics["Timeliness"] = np.random.uniform(0, 100)  # Placeholder

    # Validity: Example of valid ranges/values for a column
    if 'age' in df.columns:
        valid_ages = df['age'].between(0, 120).mean() * 100
        metrics["Validity"] = valid_ages
    else:
        metrics["Validity"] = np.random.uniform(0, 100)  # Placeholder

    # Accuracy: Placeholder, needs actual implementation
    metrics["Accuracy"] = np.random.uniform(0, 100)  # Placeholder

    # Consistency: Placeholder, needs actual implementation
    metrics["Consistency"] = np.random.uniform(0, 100)  # Placeholder

    # Uniqueness: Example for uniqueness check
    unique_counts = df.nunique() / len(df) * 100
    metrics["Uniqueness"] = unique_counts.mean()

    return metrics


@app.post("/upload-csv", response_model=dict)
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(StringIO(contents.decode('utf-8')))

    metrics = calculate_metrics(df)

    data = []
    for key, value in metrics.items():
        data.append({
            "id": key,
            "data": [{"x": key, "y": value}]
        })

    return {"metrics": data}  # Wrap the list in a dictionary

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
