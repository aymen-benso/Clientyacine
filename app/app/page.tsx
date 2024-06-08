import React, { useState } from 'react';
import { Chart } from 'react-chartjs-2';

type DataQualityReport = {
  dataTypes: Record<string, string>;
  descriptiveStatistics: Record<string, any>;
  missingValues: Record<string, number>;
  duplicateCount: number;
  numericDistributions: Record<string, number[]>;
};

const Home: React.FC = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/data-profiling', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error uploading file');
      }

      const result: DataQualityReport = await response.json();
      setReport(result);
      setError(null);
    } catch (err : any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>CSV Data Profiling</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {report && (
        <div>
          <h2>Data Types</h2>
          <pre>{JSON.stringify(report.dataTypes, null, 2)}</pre>

          <h2>Descriptive Statistics</h2>
          <pre>{JSON.stringify(report.descriptiveStatistics, null, 2)}</pre>

          <h2>Missing Values</h2>
          <pre>{JSON.stringify(report.missingValues, null, 2)}</pre>

          <h2>Duplicate Count</h2>
          <p>{report.duplicateCount}</p>

          <h2>Numeric Distributions</h2>
          {Object.entries(report.numericDistributions).map(([column, values]) => (
            <div key={column}>
              <h3>{column}</h3>
              <Chart
                type="bar"
                data={{
                  labels: values.map((_, index) => index.toString()),
                  datasets: [
                    {
                      label: column,
                      data: values,
                      backgroundColor: 'rgba(75,192,192,0.4)',
                      borderColor: 'rgba(75,192,192,1)',
                      borderWidth: 1,
                    },
                  ],
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
