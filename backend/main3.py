from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import numpy as np
import os
import shutil
from fastapi.middleware.cors import CORSMiddleware
import json
from io import StringIO
import tempfile

app = FastAPI()

# Set up CORS
origins = [
    "*",  # Replace with your actual frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)


def generate_report(df):
    report = {
        "dataTypes": {},
        "columnInfo": {},
        "descriptiveStatistics": {},
        "missingValues": {},
        "duplicateCount": 0,
    }

    columns = df.columns

    # Data Types
    for column in columns:
        report["dataTypes"][column] = str(df[column].dtype)

    # Column Information
    for column in columns:
        column_info = {
            "type": str(df[column].dtype),
            "count": df[column].count(),
            "mean": df[column].mean() if np.issubdtype(df[column].dtype, np.number) else None,
            "std": df[column].std() if np.issubdtype(df[column].dtype, np.number) else None,
            "min": df[column].min() if np.issubdtype(df[column].dtype, np.number) else None,
            "25%": df[column].quantile(0.25) if np.issubdtype(df[column].dtype, np.number) else None,
            "50%": df[column].quantile(0.5) if np.issubdtype(df[column].dtype, np.number) else None,
            "75%": df[column].quantile(0.75) if np.issubdtype(df[column].dtype, np.number) else None,
            "max": df[column].max() if np.issubdtype(df[column].dtype, np.number) else None,
            "unique": df[column].nunique(),
            "top": df[column].mode().values[0] if not df[column].empty and df[column].dtype.name != 'category' else None,
            "freq": df[column].value_counts().values[0] if not df[column].empty and df[column].dtype.name != 'category' else None,
            "null_count": df[column].isnull().sum(),
        }
        report["columnInfo"][column] = column_info

    # Descriptive Statistics and Numeric Distributions
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    for column in numeric_columns:
        report["descriptiveStatistics"][column] = df[column].describe().to_dict()

    # Missing Values
    report["missingValues"] = df.isnull().sum().to_dict()

    # Duplicates
    report["duplicateCount"] = df.duplicated().sum()

    return report


@app.post("/upload-csv", response_model=str)
async def upload_csv(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp.close()
            filename = tmp.name
        df = pd.read_csv(filename)
        report = generate_report(df)
        return JSONResponse(content=json.dumps(report, cls=NpEncoder), status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(filename)


@app.post("/fix")
async def fix_csv(file: UploadFile = File(...)):
    try:
        # Read the uploaded CSV file
        content = await file.read()
        df = pd.read_csv(StringIO(content.decode("utf-8")))

        # Perform fixing operations: drop rows with any NaN values and remove duplicates
        fixed_df = df.dropna().drop_duplicates()

        # Convert fixed dataframe back to CSV
        output = StringIO()
        fixed_df.to_csv(output, index=False)
        output.seek(0)

        # Create a streaming response with the fixed CSV
        response = StreamingResponse(
            iter([output.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=fixed_report.csv"
        return response
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error processing file: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
