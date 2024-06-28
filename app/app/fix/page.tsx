"use client";
import React, { useState } from "react";
import axios from "axios";

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleFixUpload = async () => {
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }

      // Upload CSV file to the fix endpoint
      const response = await axios.post("http://localhost:8002/fix", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob", // Important for file download
      });

      // Create a URL for the fixed CSV file and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "fixed_report.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-semibold text-gray-800 mb-4 text-center">
          Upload CSV to Fix
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
          onClick={handleFixUpload}
          disabled={!file}
        >
          Upload and Fix CSV File
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
