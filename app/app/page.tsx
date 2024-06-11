"use client";

import React, { useState } from 'react';

interface DescriptiveStatistics {
  count: number;
  mean: number;
  std: number;
  min: number;
  '25%': number;
  '50%': number;
  '75%': number;
  max: number;
}



interface MissingValues {
  [key: string]: number;
}

interface DataProfiling {
  dataTypes: {
    [key: string]: string;
  };
  descriptiveStatistics: {
    [key: string]: DescriptiveStatistics;
  };
  missingValues: MissingValues;
  duplicateCount: number;

}

const DataProfiling: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<DataProfiling | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/data-profiling', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json().then((data) => data);
    console.log(result);
    setReport(JSON.parse(result));
  };

  return (
    <div>
      <h1>Data Profiling</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload and Analyze</button>
      {report && (
        <div>
          <h2>Data Types</h2>
          <ul>
            {Object.entries(report.dataTypes).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>

          <h2>Descriptive Statistics</h2>
          {Object.entries(report.descriptiveStatistics).map(([key, stats]) => (
            <div key={key}>
              <h3>{key}</h3>
              <ul>
                {Object.entries(stats).map(([statKey, statValue]) => (
                  <li key={statKey}>
                    {statKey}: {statValue}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <h2>Missing Values</h2>
          <ul>
            {Object.entries(report.missingValues).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>

          <h2>Duplicate Count</h2>
          <p>{report.duplicateCount}</p>


        </div>
      )}
    </div>
  );
};

export default DataProfiling;
