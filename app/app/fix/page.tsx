"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [faultyRows, setFaultyRows] = useState<any[]>([]);
  const [dropDuplicates, setDropDuplicates] = useState<boolean>(false);
  const [handleMissing, setHandleMissing] = useState<string>("drop");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      handleUpload(uploadedFile);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://localhost:8002/upload-csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const csvData = JSON.parse(response.data);
      setCsvData(csvData);
      if (dropDuplicates) {
        markDuplicateRows(csvData);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFixUpload = () => {
    // Create a copy of csvData to manipulate locally
    let processedData = [...csvData];

    // Handle dropping duplicates
    if (dropDuplicates) {
      const seenRows = new Set();
      processedData = processedData.filter((row) => {
        const rowKey = JSON.stringify(row);
        if (seenRows.has(rowKey)) {
          return false; // Drop duplicate row
        } else {
          seenRows.add(rowKey);
          return true; // Keep non-duplicate row
        }
      });
    }

    // Handle missing values
    if (handleMissing === "drop") {
      processedData = processedData.filter((row) => {
        return Object.values(row).every(
          (value) => value !== null && value !== ""
        );
      });
    } else if (handleMissing === "fill_mean") {
      processedData = processedData.map((row) => {
        return Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            value !== null && value !== ""
              ? value
              : calculateMean(key, processedData),
          ])
        );
      });
    } else if (handleMissing === "fill_median") {
      processedData = processedData.map((row) => {
        return Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            value !== null && value !== ""
              ? value
              : calculateMedian(key, processedData),
          ])
        );
      });
    }

    // Set updated data with fixed CSV and faulty rows
    setCsvData(processedData);
    setFaultyRows(findFaultyRows(csvData, processedData));

    // Download fixed CSV
    downloadCSV(processedData, "fixed.csv");
  };

  const calculateMean = (key: string, data: any[]) => {
    const values = data
      .map((row) => row[key])
      .filter((value) => typeof value === "number");
    const mean =
      values.length > 0
        ? values.reduce((acc, val) => acc + val, 0) / values.length
        : 0;
    return mean;
  };

  const calculateMedian = (key: string, data: any[]) => {
    const values = data
      .map((row) => row[key])
      .filter((value) => typeof value === "number")
      .sort();
    const median =
      values.length > 0 ? values[Math.floor(values.length / 2)] : 0;
    return median;
  };

  const findFaultyRows = (originalData: any[], processedData: any[]) => {
    const originalSet = new Set(originalData.map((row) => JSON.stringify(row)));
    return originalData.filter((row) => !originalSet.has(JSON.stringify(row)));
  };

  const downloadCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," + dataToCSV(data);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "fixed.csv".
    document.body.removeChild(link);
  };

  const dataToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    data.forEach((row) => {
      const values = headers.map((header) => row[header]);
      csvRows.push(values.join(","));
    });

    return csvRows.join("\n");
  };

  const renderCell = (value: any, isFaulty: boolean, isDuplicate: boolean) => {
    let className = "";
    if (isFaulty) {
      className = "bg-red-200";
    } else if (isDuplicate) {
      className = "bg-orange-200";
    }
    return (
      <td
        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}
      >
        {String(value)}
      </td>
    );
  };

  const markDuplicateRows = (data: any[]) => {
    const seenRows = new Set();
    const updatedCsvData = data.map((row) => ({
      ...row,
      isDuplicate: seenRows.has(JSON.stringify(row)),
    }));
    setCsvData(updatedCsvData);
    data.forEach((row) => seenRows.add(JSON.stringify(row)));
  };

  return (
    <div className="grid justify-center items-center h-screen">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md my-2 ml-24">
        <h2 className="text-3xl text-white font-semibold text-gray-800 mb-4 text-center my-px">
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

        <div className="mt-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={dropDuplicates}
              onChange={(e) => setDropDuplicates(e.target.checked)}
            />
            <span className="ml-2 text-white">Drop Duplicates</span>
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-100">
            Handle Missing Values
          </label>
          <select
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={handleMissing}
            onChange={(e) => setHandleMissing(e.target.value)}
          >
            <option value="drop">Drop Rows</option>
            <option value="fill_mean">Fill with Mean</option>
            <option value="fill_median">Fill with Median</option>
          </select>
        </div>

        <button
          className={`block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition duration-300 ${
            !file ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => handleFixUpload()}
          disabled={!file}
        >
          Upload and Fix CSV File
        </button>
      </div>

      {csvData.length > 0 && (
        <div className="mt-6">
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {Object.keys(csvData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={row.isDuplicate ? "bg-orange-200" : ""}
                  >
                    {Object.entries(row).map(([key, value], cellIndex) => {
                      const isFaulty =
                        value === null || value === undefined || value === "";
                      return renderCell(value, isFaulty, row.isDuplicate);
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {faultyRows.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Faulty Rows:</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {Object.keys(faultyRows[0]).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faultyRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.entries(row).map(([key, value], cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-red-200"
                      >
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
