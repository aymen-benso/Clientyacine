"use client";

import React, { useState } from "react";
import axios, { AxiosProgressEvent } from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { ResponsiveBar } from "@nivo/bar";
import { schemeCategory10 } from "d3-scale-chromatic"; // Importing color scheme

const FileUploadWithRadialBar: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processedRows, setProcessedRows] = useState<number>(0);
  const [failedRows, setFailedRows] = useState<number>(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post<{
        metrics: { id: string; value: number }[];
        chart_data: { id: string; data: { x: string; y: number }[] }[];
        processed_rows: number;
        failed_rows: number;
      }>(`http://localhost:8001/upload-csv`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      console.log("data : ", response.data); // Debugging: Log the response data

      setMetrics(response.data.metrics);
      setChartData(response.data.chart_data);
      setProcessedRows(response.data.processed_rows);
      setFailedRows(response.data.failed_rows);
      setUploadProgress(0); // Reset progress after successful upload
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadProgress(0); // Reset progress on error
    }
  };

  return (
    <>
      <div className="block w-1/4 p-4 bg-[#97a6c4] rounded-lg shadow-md ms-72 mt-2 opacity-80">
        <input
          type="file"
          className="block w-full text-sm text-gray-500 
          file:mr-4 file:py-2 file:px-4 
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          cursor-pointer"
          onChange={handleFileChange}
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition-all duration-300"
          onClick={handleFileUpload}
        >
          Upload
        </button>
      </div>

      {(metrics.length > 0 || chartData.length > 0) && (
        <div className="w-full rounded-lg  max-w-screen-2xl bg-[#384860] p-8 shadow-md max-w-screen-lg mt-2 ml-8">
          <div>
            <div style={{ marginBottom: "50px" }}>
              <h3 className="bg-gray-100 font-sans font-bold text-center">
                Data Quality Summary
              </h3>
              <div className="flex justify-between mt-4">
                <div className="w-1/4 bg-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-2">DQ Score</h4>
                  <p className="text-3xl font-bold">
                    {metrics
                      .find((m) => m.id === "DQ Score")
                      ?.value.toFixed(2) ?? "-"}
                  </p>
                </div>
                <div className="w-1/4 bg-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-2">Success Rows</h4>
                  <p className="text-3xl font-bold">{processedRows}</p>
                </div>
                <div className="w-1/4 bg-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-2">Failed Rows</h4>
                  <p className="text-3xl font-bold">{failedRows}</p>
                </div>
              </div>
            </div>

            <div className="flex align-itemsSpacing bg-gray-100 w-full rounded-lg ">
              {metrics.map((entry) => (
                <div
                  key={entry.id}
                  style={{ width: "100px", margin: "40px auto" }}
                >
                  <h4
                    className={`
                                inline-block
                                px-2
                                py-1
                                rounded
                                text-center
                                font-medium
                                pd-4
                                text-sm
                                my-8
                  ${
                    entry.value < 50
                      ? "bg-red-500 text-white"
                      : "bg-green-500 text-white"
                  }
                `}
                  >
                    {entry.id}
                  </h4>
                  <br />
                  <CircularProgressbar
                    value={entry.value}
                    text={`${entry.value.toFixed(2)}%`}
                    styles={buildStyles({
                      rotation: 0.25,
                      strokeLinecap: "butt",
                      textSize: "16px",
                      pathTransitionDuration: 0.5,
                      pathColor: `rgba(62, 152, 199, ${entry.value / 100})`, // Use entry.value for pathColor
                      textColor: "blue",
                      trailColor: "#d6d6d6",
                      backgroundColor: "#3e98c7",
                    })}
                  />
                </div>
              ))}
            </div>
            <br />
            <div className="mb-4">
              <h3 className="bg-gray-100 font-sans font-bold text-center mb-4">
                Data Quality Metrics
              </h3>
              <div
                className="flex justify-center w-full rounded-lg bg-gray-100"
                style={{ height: "400px" }}
              >
                <ResponsiveBar
                  data={chartData.map((entry) => ({
                    id: entry.id,
                    ...entry.data.reduce(
                      (acc, cur) => ({ ...acc, [cur.x]: cur.y }),
                      {}
                    ),
                  }))}
                  keys={chartData.map((entry) => entry.id)}
                  indexBy="id"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: "linear" }}
                  indexScale={{ type: "band", round: true }}
                  colors={schemeCategory10}
                  borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Metric",
                    legendPosition: "middle",
                    legendOffset: 32,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Value",
                    legendPosition: "middle",
                    legendOffset: -40,
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{
                    from: "color",
                    modifiers: [["darker", 1.6]],
                  }}
                  legends={[
                    {
                      dataFrom: "keys",
                      anchor: "bottom-right",
                      direction: "column",
                      justify: false,
                      translateX: 120,
                      translateY: 0,
                      itemsSpacing: 2,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemDirection: "left-to-right",
                      itemOpacity: 0.85,
                      symbolSize: 20,
                      effects: [{ on: "hover", style: { itemOpacity: 1 } }],
                    },
                  ]}
                  role="application"
                  ariaLabel="Nivo bar chart demo"
                  barAriaLabel={(e) =>
                    `${e.id}: ${e.formattedValue} in metric: ${e.indexValue}`
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUploadWithRadialBar;
