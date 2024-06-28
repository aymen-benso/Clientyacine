"use client";
import React, { useState } from "react";
import axios from "axios";

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }

      // Upload CSV file
      const uploadResponse = await axios.post(
        "http://localhost:8002/upload-csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Log response and set report data
      console.log("Upload Response Data:", uploadResponse.data);
      setReportData(uploadResponse.data);

      // Automatically trigger JSON download
      downloadJSON(uploadResponse.data, "report.json");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const downloadJSON = (jsonData: any, fileName: string) => {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-48">
        <h2 className="text-3xl font-semibold text-gray-800 mb-4 text-center">
          Report
        </h2>

        <input
          className="block w-full text-sm text-gray-500 
          file:mr-4 file:py-2 file:px-4 
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          cursor-pointer"
          type="file"
          onChange={handleFileChange}
        />

        <button
          className={`block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition duration-300 ${
            !file ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleUpload}
          disabled={!file}
        >
          Upload CSV File
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
