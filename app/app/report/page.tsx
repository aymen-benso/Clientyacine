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
}

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

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
        const reportData = await processCSVData(csvData);
        setReportData(reportData);
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
    };
  };

  const formatDQIssue = (row: ReportDataRow): string => {
    const issues: string[] = [];

    // Check for missing values
    if (!row.Phone_number) {
      issues.push("Missing Phone_number.");
    }
    if (!row.num_state) {
      issues.push("Missing num_state.");
    }

    // Check for incorrect wilaya number
    if (row.state === "Alger" && row.num_state !== "16") {
      issues.push("Incorrect wilaya number for Alger.");
    } else if (row.state === "Blida" && row.num_state !== "09") {
      issues.push("Incorrect wilaya number for Blida.");
    } else if (row.state === "Adrar" && row.num_state !== "01") {
      issues.push("Incorrect wilaya number for Adrar.");
    }

    return issues.join(" ");
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
