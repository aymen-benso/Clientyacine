"use client";
import React, { useState } from "react";
import axios, { AxiosProgressEvent } from "axios";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface RadialBarDataItem {
  x: string;
  y: number;
}

interface RadialBarData {
  id: string;
  data: RadialBarDataItem[];
  color: string;
}

const colors = [
  "#e8c1a0",
  "#f47560",
  "#f1e15b",
  "#e8a838",
  "#61cdbb",
  "#97e3d5",
];

const FileUploadWithRadialBar: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<RadialBarData[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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
      const response = await axios.post<{ metrics: RadialBarData[] }>(
        `http://localhost:8001/upload-csv`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          },
        },
      );
      const metricsWithColors = response.data.metrics.map((metric, index) => ({
        ...metric,
        color: colors[index % colors.length],
      }));
      setData(metricsWithColors);
      setUploadProgress(0);  // Reset progress after successful upload
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadProgress(0);  // Reset progress on error
    }
  };

  return (
    <>
    <div className="block w-1/4 p-4 bg-white rounded-lg shadow-md ms-72 mt-2">
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

  <div className="w-full max-w-screen-2xl bg-white p-8 rounded-lg shadow-md max-w-screen-lg mt-2 ">


      {uploadProgress > 0 && uploadProgress < 100 && (
        <div style={{ width: '100px', margin: '20px auto' }}>
          <CircularProgressbar
            value={uploadProgress}
            text={`${uploadProgress}%`}
            styles={buildStyles({
              rotation: 0.25,
              strokeLinecap: 'butt',
              textSize: '16px',
              pathTransitionDuration: 0.5,
              pathColor: `rgba(62, 152, 199, ${uploadProgress / 100})`,
              textColor: 'blue',
              trailColor: '#d6d6d6',
              backgroundColor: '#3e98c7',
            })}
          />
        </div>
      )}



        <div>


          <div style={{ marginBottom: "50px" }}>
            <h3 className="bg-gray-100 font-sans font-bold text-center">All Metrics</h3>
            <div className="flex flex-wrap justify-center">
              {data.map((metric, index) => (
                <div key={index} style={{ width: '150px', margin: '20px' }}>
                  <h4 className="text-center">{metric.id}</h4>
                  {metric.data.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '10px' }}>
                      <CircularProgressbar
                        value={item.y}
                        text={`${Math.round(item.y)}%`}
                        styles={buildStyles({
                          rotation: 0.25,
                          strokeLinecap: 'butt',
                          textSize: '16px',
                          pathTransitionDuration: 0.5,
                          pathColor: `rgba(62, 152, 199, ${item.y / 100})`,
                          textColor: 'blue',
                          trailColor: '#d6d6d6',
                          backgroundColor: '#3e98c7',
                        })}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default FileUploadWithRadialBar;
