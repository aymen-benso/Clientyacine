from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import os
import shutil
from fastapi.middleware.cors import CORSMiddleware
import json
import json
import numpy as np

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

# Your codes .... 


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

def generate_report(df):
    columns = df.columns
    report = {
        "dataTypes": {},
        "descriptiveStatistics": {},
        "missingValues": {},
        "duplicateCount": 0,
        

    }

    # Data Types
    for column in columns:
        report["dataTypes"][column] = str(df[column].dtype)

    # Descriptive Statistics and Numeric Distributions
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    for column in numeric_columns:
        report["descriptiveStatistics"][column] = df[column].describe().to_dict()

    # Missing Values
    report["missingValues"] = df.isnull().sum().to_dict()

    # Duplicates
    report["duplicateCount"] = df.duplicated().sum()
     
    print(json.dumps(report, cls=NpEncoder))

    return json.dumps(report, cls=NpEncoder)

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
    
    return JSONResponse(content=report, status_code=200)    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
