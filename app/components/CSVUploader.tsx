"use client";
import React, { useState } from 'react';
import { parse } from 'csv-parse';

type DataQualityCriteria = {
  name: string;
  check: (data: any[]) => { applied: boolean, percentage: number };
};

const dataQualityCriteria: DataQualityCriteria[] = [
  {
    name: "Non-empty rows",
    check: (data) => {
      const nonEmptyRows = data.filter(row => row.some((cell : any) => cell.trim() !== ""));
      return {
        applied: nonEmptyRows.length === data.length,
        percentage: (nonEmptyRows.length / data.length) * 100
      };
    }
  },
  // Add more criteria as needed
];

const CSVUploader: React.FC = () => {
  const [results, setResults] = useState<{ name: string, applied: boolean, percentage: number }[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      parse(text, {}, (err, output) => {
        if (err) {
          console.error(err);
          return;
        }

        const result = dataQualityCriteria.map(criteria => ({
          name: criteria.name,
          ...criteria.check(output)
        }));

        setResults(result);
      });
    };

    reader.readAsText(file);
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <div>
        {results.map(result => (
          <div key={result.name}>
            <h3>{result.name}</h3>
            <p>Applied: {result.applied ? 'Yes' : 'No'}</p>
            <p>Percentage: {result.percentage.toFixed(2)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CSVUploader;
