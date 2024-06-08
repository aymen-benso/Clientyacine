from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import os
import shutil


def generate_report(df):
    columns = df.columns
    report = {
        "dataTypes": {},
        "descriptiveStatistics": {},
        "missingValues": {},
        "duplicateCount": 0,
        "numericDistributions": {}
    }

    # Data Types
    for column in columns:
        report["dataTypes"][column] = str(df[column].dtype)

    # Descriptive Statistics and Numeric Distributions
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    for column in numeric_columns:
        report["descriptiveStatistics"][column] = df[column].describe().to_dict()
        report["numericDistributions"][column] = df[column].tolist()

    # Missing Values
    report["missingValues"] = df.isnull().sum().to_dict()

    # Duplicates
    report["duplicateCount"] = df.duplicated().sum()

    return report

app = FastAPI()

@app.post("/data-profiling")
async def handle_data_profiling(file: UploadFile = File(...)):
    # Save the uploaded file
    file_location = f"/tmp/{file.filename}"
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Load the data
    df = pd.read_csv(file_location)
    os.remove(file_location)

    # Generate the report
    report = generate_report(df)

    return JSONResponse(content=report)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
