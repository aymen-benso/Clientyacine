from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
import pandas as pd
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from io import StringIO
import tempfile
import json

app = FastAPI()

# Set up CORS
origins = ["*"]  # Replace with your actual frontend origin

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


@app.post("/upload-csv", response_model=str)
async def upload_csv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(StringIO(content.decode("utf-8")))
        csv_data = df.to_json(orient='records')
        return JSONResponse(content=csv_data, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fix")
async def fix_csv(
    file: UploadFile = File(...),
    drop_duplicates: bool = False,
    handle_missing: str = "drop",
):
    try:
        content = await file.read()
        df = pd.read_csv(StringIO(content.decode("utf-8")))

        # Get faulty rows
        faulty_rows = df[df.isnull().any(axis=1) | df.duplicated()]

        if drop_duplicates:
            df = df.drop_duplicates()

        if handle_missing == "drop":
            df = df.dropna()
        elif handle_missing == "fill_mean":
            df = df.fillna(df.mean())
        elif handle_missing == "fill_median":
            df = df.fillna(df.median())

        # Convert DataFrames to CSV strings
        fixed_csv = df.to_csv(index=False)
        faulty_rows_csv = faulty_rows.to_csv(index=False)

        # Return both CSV files as responses
        return {
            "fixed_csv": fixed_csv,
            "faulty_rows_csv": faulty_rows_csv,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {e}")


@app.get("/download-fixed-csv")
async def download_fixed_csv():
    try:
        # Generate a temporary directory to save the file
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file_path = os.path.join(temp_dir, "fixed.csv")
            # Write the fixed CSV content to the temporary file
            with open(temp_file_path, "w") as f:
                f.write(fixed_csv)  # Use the fixed_csv variable from /fix endpoint

            # Return the file as a response
            return FileResponse(temp_file_path, filename="fixed.csv")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating download: {e}")


@app.get("/download-faulty-rows-csv")
async def download_faulty_rows_csv():
    try:
        # Generate a temporary directory to save the file
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file_path = os.path.join(temp_dir, "faulty_rows.csv")
            # Write the faulty rows CSV content to the temporary file
            with open(temp_file_path, "w") as f:
                f.write(faulty_rows_csv)  # Use the faulty_rows_csv variable from /fix endpoint

            # Return the file as a response
            return FileResponse(temp_file_path, filename="faulty_rows.csv")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating download: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
