import React, { useState, useRef, useCallback } from 'react';
import { removeWatermark } from './services/gemini';
import { AppState, ProcessingError } from './types';
import Button from './components/Button';
import ComparisonViewer from './components/ComparisonViewer';
import ImageSelector from './components/ImageSelector';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [maskBase64, setMaskBase64] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<ProcessingError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError({ message: 'Please upload a valid image file.' });
        return;
      }
      
      const previewUrl = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setOriginalPreview(previewUrl);
      setAppState(AppState.IDLE);
      setProcessedImage(null);
      setMaskBase64(null); // Reset mask
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(droppedFile);
      setFile(droppedFile);
      setOriginalPreview(previewUrl);
      setAppState(AppState.IDLE);
      setProcessedImage(null);
      setMaskBase64(null); // Reset mask
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      // Pass the mask if available
      const result = await removeWatermark(file, maskBase64);
      setProcessedImage(result.imageUrl);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      setAppState(AppState.ERROR);
      setError({
        message: 'Failed to process image.',
        details: err.message || 'Unknown error occurred.'
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setOriginalPreview(null);
    setProcessedImage(null);
    setMaskBase64(null);
    setAppState(AppState.IDLE);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `clean-${file?.name || 'image'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="w-full p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
              WatermarkGone AI
            </h1>
          </div>
          <div className="text-sm text-slate-400">
            Powered by Gemini 2.5
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full max-w-7xl mx-auto">
        
        {/* State: IDLE or PREVIEW (Not Processed Yet) */}
        {appState !== AppState.SUCCESS && (
          <div className="w-full max-w-2xl flex flex-col gap-8 animate-fade-in-up">
            
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Remove Watermarks <br/>
                <span className="text-indigo-400">Instantly</span>
              </h2>
              <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
                Upload an image. Optionally select the area to clean for better precision.
              </p>
            </div>

            {/* Upload Area */}
            {!originalPreview ? (
              <div 
                className="group relative border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-800/50 rounded-2xl p-12 transition-all cursor-pointer bg-slate-800/20"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-700/50 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white">Click or drag image here</p>
                    <p className="text-sm text-slate-400 mt-1">Supports JPG, PNG, WEBP</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Image Selection Component */}
                <ImageSelector 
                  src={originalPreview} 
                  onMaskChange={setMaskBase64} 
                />
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button 
                    onClick={handleProcess} 
                    isLoading={appState === AppState.PROCESSING}
                    disabled={appState === AppState.PROCESSING}
                    className="w-full md:w-auto min-w-[200px] text-lg py-3"
                  >
                    {appState === AppState.PROCESSING 
                      ? 'Removing Watermark...' 
                      : maskBase64 
                        ? 'Remove Selected Watermark' 
                        : 'Auto Remove Watermark'
                    }
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-400">Error</h3>
                  <p className="text-sm text-red-300 mt-1">{error.message}</p>
                  {error.details && <p className="text-xs text-red-400/70 mt-1">{error.details}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* State: SUCCESS */}
        {appState === AppState.SUCCESS && originalPreview && processedImage && (
          <ComparisonViewer 
            originalSrc={originalPreview}
            processedSrc={processedImage}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </main>
      
      <footer className="w-full p-6 text-center text-slate-500 text-sm border-t border-white/5">
        <p>
          Images are processed securely using Google's Gemini API. 
        </p>
      </footer>
    </div>
  );
};

export default App;