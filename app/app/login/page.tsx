"use client";

import React, { useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar, ResponsiveBarCanvas } from '@nivo/bar';
import { Progress } from "@material-tailwind/react";
import { ComputedLink, ResponsiveTree } from '@nivo/tree';

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
    const result = await response.json();
    console.log(result);
    setReport(JSON.parse(result));
  };



  const formatDataForPie = (data: { [key: string]: number | string }) => {
    return Object.entries(data).map(([key, value]) => ({
      id: key,
      label: key,
      value: typeof value === 'number' ? value : parseFloat(value),
    }));
  };

  const formatDataForBar = (data: { [key: string]: number }) => {
    return Object.entries(data).map(([key, value]) => ({
      category: key,
      value: value,
    }));
  };

  const formatDataForTree = (data: { [key: string]: string }) => {
    return {
      id: 'root',
      name: 'root',
      color: '#ffffff',  // Add a default color for the root object
      children: Object.entries(data).map(([key, value]) => ({
        id: key,
        name: key,
        color: value,
      })),
    };
  };


  return (
    <div className='flex mx-auto p-4 w-1/2 flex-col'>

<div className='flex flex-col bg-white p-6 rounded-lg shadow-md max-w-md mx-auto'>

  <h2 className='text-3xl font-semibold text-gray-800 mb-4'>
    Data Profiling
  </h2>
  
  <input 
        type='file' 
        className='block w-full text-sm text-gray-500 
                   file:mr-4 file:py-2 file:px-4 
                   file:rounded-lg file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100
                   cursor-pointer'
        onChange={handleFileChange} 
      />
  
  <button
    className='bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition-all duration-300'
    onClick={handleUpload}>
    Upload and Analyze
  </button>
  
</div>


      <div className='flex flex-col bg-white p-4 rounded mt-4'>

      
      {report && (
        <div>
          <h2>Data Types</h2>
          <div style={{ height: 500 }}>
            <ResponsiveTree
                data={formatDataForTree(report.dataTypes)}
                identity="id"
                activeNodeSize={24}
                inactiveNodeSize={12}
                nodeColor={{ scheme: 'tableau10' }}
                fixNodeColorAtDepth={1}
                linkThickness={2}
                activeLinkThickness={8}
                inactiveLinkThickness={2}
                linkColor={{
                  from: 'target.color',
                  modifiers: [['opacity', 0.4]],
                }}
                margin={{ top: 90, right: 90, bottom: 90, left: 90 }}
                motionConfig="stiff"
                meshDetectionRadius={80}
                nodeTooltip={({ node }) => (
                  <div
                    style={{
                      padding: '5px 10px',
                      background: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                    }}
                  >
                    <strong>{node.data.name}</strong>: {node.data.color}
                  </div>
                )}
                linkTooltip={({ link }) => (
                  <div
                    style={{
                      padding: '5px 10px',
                      background: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                    }}
                  >
                    <strong>{link.source.data.name}</strong> →{' '}
                    <strong>{link.target.data.name}</strong>
                  </div>
                )} onLinkMouseEnter={function (node: ComputedLink<{
                  id: string; name: string; color: string; // Add a default color for the root object
                  children: { id: string; name: string; color: string; }[];
                }>, event: React.MouseEvent<Element, MouseEvent>): void {
                  throw new Error('Function not implemented.');
                } } onLinkMouseMove={function (node: ComputedLink<{
                  id: string; name: string; color: string; // Add a default color for the root object
                  children: { id: string; name: string; color: string; }[];
                }>, event: React.MouseEvent<Element, MouseEvent>): void {
                  throw new Error('Function not implemented.');
                } } onLinkMouseLeave={function (node: ComputedLink<{
                  id: string; name: string; color: string; // Add a default color for the root object
                  children: { id: string; name: string; color: string; }[];
                }>, event: React.MouseEvent<Element, MouseEvent>): void {
                  throw new Error('Function not implemented.');
                } } onLinkClick={function (node: ComputedLink<{
                  id: string; name: string; color: string; // Add a default color for the root object
                  children: { id: string; name: string; color: string; }[];
                }>, event: React.MouseEvent<Element, MouseEvent>): void {
                  throw new Error('Function not implemented.');
                } } linkTooltipAnchor={'top'}
            />

          </div>

          <h2>
            Descriptive Statistics
          </h2>
          {Object.entries(report.descriptiveStatistics).map(([key, stats]) => (
            <div key={key}>
              <h3>{key}</h3>
              <div style={{ height: 400 }}>
                <ResponsiveBar
                  data={formatDataForBar(stats as any)}
                  keys={['value']}
                  indexBy="category"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  colors={{ scheme: 'nivo' }}
                  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Category',
                    legendPosition: 'middle',
                    legendOffset: 32,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Value',
                    legendPosition: 'middle',
                    legendOffset: -40,
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  animate={true}
                  motionStiffness={90}
                  motionDamping={15}
                />
              </div>
            </div>
          ))}

          <h2>Missing Values</h2>
          <div style={{ height: 400 }}>
            <ResponsivePie
              data={formatDataForPie(report.missingValues)}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              colors={{ scheme: 'nivo' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              radialLabelsSkipAngle={10}
              radialLabelsTextXOffset={6}
              radialLabelsTextColor="#333333"
              radialLabelsLinkOffset={0}
              radialLabelsLinkDiagonalLength={16}
              radialLabelsLinkHorizontalLength={24}
              radialLabelsLinkStrokeWidth={1}
              radialLabelsLinkColor={{ from: 'color' }}
              slicesLabelsSkipAngle={10}
              slicesLabelsTextColor="#333333"
              animate={true}
              motionStiffness={90}
              motionDamping={15}
            />
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-semibold mb-4">Duplicate Count</h2>
      <p className="text-3xl font-bold text-gray-800">{report.duplicateCount}</p></div>
      <Progress value={report.duplicateCount } max={report.descriptiveStatistics.count} color="blue" />
      
    
        </div>
      )}

      </div>
    </div>
  );
};

export default DataProfiling;
