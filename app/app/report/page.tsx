"use client";
import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { saveAs } from "file-saver";
import csvParser from "csv-parser";
import { Readable } from "stream";

interface Metric {
  id: string;
  value: number;
}

interface ReportDataRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  Phone_number: string;
  state: string;
  num_state: string;
  Date_of_birth: string;
  DQ_issue: string;
}

interface ReportData {
  metrics: Metric[];
  processed_rows: number;
  failed_rows: number;
  reportRows: ReportDataRow[];
  missingValues: { [key: string]: number };
  duplicateEntries: number;
  invalidEmails: number;
  invalidDates: number;
  incorrectWilayaNumbers: number;
}

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result;
      if (typeof csvData === "string") {
        try {
          const reportData = await processCSVData(csvData);
          setReportData(reportData);
          setError(null);
        } catch (err) {
          console.error("Error processing CSV:", err);
          setError("An error occurred while processing the CSV file.");
        }
      }
    };
    reader.readAsText(file);
  };

  const processCSVData = async (csvData: string): Promise<ReportData> => {
    const stream = Readable.from([csvData]);
    const metrics: Metric[] = [];
    const reportRows: ReportDataRow[] = [];
    let processedRows = 0;
    let failedRows = 0;
    let missingValues: { [key: string]: number } = {};
    let duplicateEntries = 0;
    let invalidEmails = 0;
    let invalidDates = 0;
    let incorrectWilayaNumbers = 0;

    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on("data", (row: any) => {
          const dqIssue = formatDQIssue(row);
          const formattedRow: ReportDataRow = {
            id: row.id,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            Phone_number: row.Phone_number,
            state: row.state,
            num_state: row.num_state,
            Date_of_birth: row.Date_of_birth,
            DQ_issue: dqIssue,
          };

          // Check for duplicate entries
          const isDuplicate = reportRows.some(
            (r) =>
              r.id === formattedRow.id &&
              r.first_name === formattedRow.first_name &&
              r.last_name === formattedRow.last_name &&
              r.email === formattedRow.email
          );

          if (!isDuplicate) {
            reportRows.push(formattedRow);
            processedRows++;
          } else {
            failedRows++;
            duplicateEntries++;
          }

          // Update data quality metrics
          Object.keys(formattedRow).forEach((key) => {
            if (!formattedRow[key as keyof ReportDataRow]) {
              missingValues[key] = (missingValues[key] || 0) + 1;
            }
          });

          if (!isValidEmail(formattedRow.email)) {
            invalidEmails++;
          }

          if (!isValidDate(formattedRow.Date_of_birth)) {
            invalidDates++;
          }

          if (
            (formattedRow.state === "Alger" &&
              formattedRow.num_state !== "16") ||
            (formattedRow.state === "Blida" &&
              formattedRow.num_state !== "09") ||
            (formattedRow.state === "Adrar" && formattedRow.num_state !== "01")
          ) {
            incorrectWilayaNumbers++;
          }
        })
        .on("error", (err: any) => {
          console.error("Error processing CSV:", err);
          failedRows++;
        })
        .on("end", () => {
          resolve();
        });
    });

    return {
      metrics,
      processed_rows: processedRows,
      failed_rows: failedRows,
      reportRows,
      missingValues,
      duplicateEntries,
      invalidEmails,
      invalidDates,
      incorrectWilayaNumbers,
    };
  };

  const formatDQIssue = (row: ReportDataRow): string => {
    const issues: string[] = [];

    // Check for missing values
    Object.keys(row).forEach((key) => {
      if (!row[key as keyof ReportDataRow]) {
        issues.push(`Missing ${key}.`);
      }
    });

    // Check for incorrect wilaya number
    if (row.state === "Alger" && row.num_state !== "16") {
      issues.push("Incorrect wilaya number for Alger.");
    } else if (row.state === "Blida" && row.num_state !== "09") {
      issues.push("Incorrect wilaya number for Blida.");
    } else if (row.state === "Adrar" && row.num_state !== "01") {
      issues.push("Incorrect wilaya number for Adrar.");
    }

    // Check for invalid email format
    if (!isValidEmail(row.email)) {
      issues.push("Invalid email format.");
    }

    // Check for invalid date format
    if (!isValidDate(row.Date_of_birth)) {
      issues.push("Invalid date format.");
    }

    return issues.join(" ");
  };

  const isValidEmail = (email: string): boolean => {
    // Add email validation logic here
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  const isValidDate = (dateString: string): boolean => {
    // Add date validation logic here
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    return dateRegex.test(dateString);
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;

    const csvContent = [
      [
        "id",
        "first_name",
        "last_name",
        "email",
        "Phone_number",
        "state",
        "num_state",
        "Date_of_birth",
        "DQ_issue",
      ],
      ...reportData.reportRows.map((row) => [
        row.id,
        row.first_name,
        row.last_name,
        row.email,
        row.Phone_number,
        row.state,
        row.num_state,
        row.Date_of_birth,
        row.DQ_issue,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "report.csv");
  };

  const chartData = {
    labels: reportData?.metrics?.map((metric) => metric.id) || [],
    datasets: [
      {
        label: "Data Quality Metrics",
        data:
          reportData?.metrics?.map((metric) => metric.value.toFixed(2)) || [],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
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

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {reportData && (
          <div className="mt-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Data Quality Report
            </h3>
            <div className="max-h-[400px] overflow-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    {Object.keys(reportData.reportRows[0]).map((key) => (
                      <th
                        key={key}
                        className="py-2 px-4 border-b sticky top-0 bg-white"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.reportRows.map((row, index) => (
                    <tr key={index}>
                      {Object.keys(row).map((key) => (
                        <td key={key} className="py-2 px-4 border-b">
                          {row[key as keyof ReportDataRow]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <h4 className="text-xl font-semibold text-gray-800 mb-2">
                Data Quality Metrics
              </h4>
              <ul>
                <li>Processed Rows: {reportData.processed_rows}</li>
                <li>Failed Rows: {reportData.failed_rows}</li>
                <li>Duplicate Entries: {reportData.duplicateEntries}</li>
                <li>Invalid Emails: {reportData.invalidEmails}</li>
                <li>Invalid Dates: {reportData.invalidDates}</li>
                <li>
                  Incorrect Wilaya Numbers: {reportData.incorrectWilayaNumbers}
                </li>
              </ul>
            </div>

            <button
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition duration-300"
              onClick={handleDownloadCSV}
            >
              Download CSV Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
