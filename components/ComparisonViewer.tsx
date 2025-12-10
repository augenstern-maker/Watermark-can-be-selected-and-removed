import React, { useState } from 'react';

interface ComparisonViewerProps {
  originalSrc: string;
  processedSrc: string;
  onDownload: () => void;
  onReset: () => void;
}

const ComparisonViewer: React.FC<ComparisonViewerProps> = ({ originalSrc, processedSrc, onDownload, onReset }) => {
  const [activeTab, setActiveTab] = useState<'original' | 'processed'>('processed');

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl animate-fade-in">
      <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        
        {/* Toggle Controls */}
        <div className="flex border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <button
            onClick={() => setActiveTab('original')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'original' 
                ? 'bg-slate-800 text-white border-b-2 border-indigo-500' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'processed' 
                ? 'bg-slate-800 text-white border-b-2 border-emerald-500' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Result (Clean)
            </span>
          </button>
        </div>

        {/* Image Display */}
        <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center p-4">
           {/* We use key to force re-render animation when switching */}
           <div className="relative h-full w-full flex items-center justify-center">
             <img 
               key={activeTab}
               src={activeTab === 'original' ? originalSrc : processedSrc} 
               alt={activeTab} 
               className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
             />
             {activeTab === 'processed' && (
                <div className="absolute top-4 right-4 bg-emerald-500/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-blur">
                  AI Enhanced
                </div>
             )}
           </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
          <button 
            onClick={onReset}
            className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 rounded transition-colors"
          >
            Start Over
          </button>
          
          <button 
             onClick={onDownload}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg shadow-lg shadow-emerald-500/20 font-medium transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Result
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonViewer;
