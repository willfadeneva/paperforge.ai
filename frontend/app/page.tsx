'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { FaSpinner, FaFilePdf } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';

export default function PDFSummarizer() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'http://localhost:8000/summarize-pdf',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSummary(response.data.summary);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'Failed to process PDF');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">PDF Summarizer</h1>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <FaFilePdf className="text-4xl text-red-500" />
              <p className="text-lg text-gray-700">
                {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF file, or click to select'}
              </p>
              <p className="text-sm text-gray-500">Only PDF files accepted</p>
              {fileName && (
                <p className="text-sm font-medium mt-2">
                  Selected: <span className="text-blue-600">{fileName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-center text-blue-600">
              <FaSpinner className="animate-spin mr-2" />
              Processing PDF...
            </div>
          </div>
        )}

        {summary && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Summary</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}