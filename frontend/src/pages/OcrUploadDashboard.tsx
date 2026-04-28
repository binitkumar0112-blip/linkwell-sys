import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, ChevronRight, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function OcrUploadDashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'scanning' | 'complete'>('idle');

  // Determine redirect based on user role
  const redirectPath = role === 'volunteer' ? '/volunteer-dashboard' : '/ngo-dashboard';

  // hardcoded extraction result for demo
  const extractedData = {
    title: "Leaking Overhead Water Tank",
    description: "The municipal tank near building 4 has a major crack. Water is spilling over the road, creating a hazard and wasting drinking water.",
    locality: "Chembur Naka",
    category: "Infrastructure",
    urgency: "High"
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    startScan();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startScan();
    }
  };

  const startScan = () => {
    setUploadState('scanning');
    setTimeout(() => setUploadState('complete'), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto my-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-gray-900 mb-2">Paper Survey Digitization (OCR)</h1>
        <p className="text-gray-600">Upload photographed or scanned community problem forms to automatically extract text and create tasks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Upload Document</h2>
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
              ${uploadState === 'scanning' ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept="image/*,.pdf"
              onChange={handleFileInput}
              disabled={uploadState !== 'idle'}
            />
            
            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Drag & drop your survey here</h3>
            <p className="text-sm text-gray-500">Supports JPG, PNG, or PDF</p>
          </div>

          {uploadState === 'idle' && (
            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Ensure handwriting is legible and the photo is well-lit for best results.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Extraction Preview</h2>
          
          <div className="bg-white border border-gray-200 rounded-xl min-h-[300px] overflow-hidden flex flex-col">
            {uploadState === 'idle' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p>Upload a document to see extracted details here.</p>
              </div>
            ) : uploadState === 'scanning' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-primary-600 p-8 text-center">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-medium text-gray-900">Scanning document...</p>
                <p className="text-sm text-gray-500 mt-1">Running OCR extraction</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col animate-in fade-in duration-500">
                <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    Extraction Successful
                  </div>
                </div>
                
                <div className="p-6 flex-1 space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-medium">Extracted Title</label>
                    <p className="text-gray-900 font-medium mt-1">{extractedData.title}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-medium">Extracted Description</label>
                    <p className="text-gray-700 mt-1">{extractedData.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Location</label>
                      <div className="flex items-center gap-1.5 text-gray-900 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {extractedData.locality}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Category</label>
                      <div className="mt-1 inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {extractedData.category}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams({
                        title: extractedData.title,
                        description: extractedData.description,
                        category: extractedData.category.toLowerCase(),
                        locality: extractedData.locality,
                        source: 'ocr'
                      });
                      navigate(`/report?${params.toString()}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Approve & Create Task
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
