import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import InteractiveCanvas from './components/InteractiveCanvas';
import Toolbar from './components/Toolbar';
import { Point, PointType, AppState } from './types';
import { segmentImage } from './services/geminiService';

// Define a local interface for AIStudio to avoid global type conflicts
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [mode, setMode] = useState<PointType>(PointType.POSITIVE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Check for API Key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const aistudio = (window as any).aistudio as AIStudio | undefined;
        if (aistudio) {
          const hasKey = await aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          // Fallback for dev environments without the studio wrapper
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasApiKey(false);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    setPermissionError(null); // Clear previous errors
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        // Assuming success if the modal closes, as per SDK guidelines we assume it was successful to avoid race conditions
        setHasApiKey(true);
      } catch (e) {
        console.error("Error selecting API key:", e);
      }
    }
  };

  const handleImageSelected = (base64: string) => {
    setSourceImage(base64);
    setResultImage(null);
    setPoints([]);
    setAppState(AppState.IDLE);
    setErrorMessage(null);
  };

  const handlePointAdd = (point: Point) => {
    setPoints((prev) => [...prev, point]);
  };

  const handlePointRemove = (id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetPoints = () => {
    setPoints([]);
  };

  const handleProcess = async () => {
    if (!sourceImage || points.length === 0) return;

    setAppState(AppState.PROCESSING);
    setErrorMessage(null);

    try {
      const segmentedImage = await segmentImage(sourceImage, points);
      setResultImage(segmentedImage);
      setAppState(AppState.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      
      // If we get a permission denied error during processing, prompt for key again
      if (error.message?.includes("Permission Denied")) {
        setHasApiKey(false);
        setPermissionError("Your selected API Key does not have permission to access the Gemini 3 Pro model. Please select a paid project key or enable the API.");
      } else {
        setErrorMessage(error.message || "Something went wrong. Please try again.");
      }
    }
  };

  const resetAll = () => {
    setSourceImage(null);
    setResultImage(null);
    setPoints([]);
    setAppState(AppState.IDLE);
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
          <p className="text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 19l-1 1-1 1-2-2 2-2-.757-.757A6 6 0 1121 9z" />
             </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">API Key Required</h2>
          
          {permissionError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 text-sm text-red-200">
              {permissionError}
            </div>
          ) : (
            <p className="text-gray-400 mb-8">
              To use the SmartSegment SAM3 features, please select a valid Google Gemini API Key.
              <br/><br/>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline text-sm">
                Learn more about billing requirements
              </a>
            </p>
          )}

          <button
            onClick={handleSelectKey}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <span>{permissionError ? 'Select Different Key' : 'Select API Key'}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              SmartSegment (SAM3)
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {sourceImage && (
              <button 
                onClick={resetAll}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Start Over
              </button>
            )}
            {/* Optional: Change API Key button */}
             <button 
              onClick={handleSelectKey}
              className="text-xs text-gray-500 hover:text-indigo-400 border border-gray-800 hover:border-indigo-500/50 rounded-full px-3 py-1 transition-all"
            >
              API Key
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col items-center">
        
        {!sourceImage ? (
          <div className="w-full max-w-xl mt-12 animate-fade-in-up">
             <div className="text-center mb-8">
               <h2 className="text-3xl md:text-4xl font-bold mb-4">Semantic Object Extraction</h2>
               <p className="text-gray-400">
                 Like "removebg" but smarter. Use <strong>SAM3</strong> logic to Add (+) objects and Subtract (-) specific parts.
               </p>
             </div>
             <ImageUploader onImageSelected={handleImageSelected} />
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6">
            
            {/* Toolbar */}
            <div className="sticky top-24 z-40 w-full max-w-3xl mx-auto">
              <Toolbar 
                currentMode={mode}
                onModeChange={setMode}
                onClear={handleResetPoints}
                onProcess={handleProcess}
                appState={appState}
                hasPoints={points.length > 0}
              />
            </div>

            {/* Work Area */}
            <div className="flex flex-col xl:flex-row gap-6 items-start justify-center min-h-[50vh]">
              
              {/* Input Canvas */}
              <div className="flex-1 w-full bg-gray-900 rounded-2xl p-1 border border-gray-800 shadow-2xl relative group">
                <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-gray-300 border border-white/10 pointer-events-none">
                  Source Image
                </div>
                <InteractiveCanvas 
                  imageSrc={sourceImage}
                  points={points}
                  mode={mode}
                  onPointAdd={handlePointAdd}
                  onPointRemove={handlePointRemove}
                />
              </div>

              {/* Result View */}
              {(resultImage || appState === AppState.PROCESSING) && (
                 <div className="flex-1 w-full bg-gray-900 rounded-2xl p-1 border border-gray-800 shadow-2xl relative min-h-[400px]">
                   <div className="absolute top-4 left-4 z-20 bg-indigo-900/50 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-indigo-200 border border-indigo-500/20 pointer-events-none">
                    Extracted Result
                   </div>
                   <div className="w-full h-full flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-800/50 rounded-lg overflow-hidden">
                     {resultImage ? (
                       <img 
                        src={resultImage} 
                        alt="Segmented Result" 
                        className="max-h-[60vh] max-w-full object-contain animate-fade-in"
                       />
                     ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-500 animate-pulse">
                          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                          <p>Running Semantic Segmentation...</p>
                        </div>
                     )}
                   </div>
                   {resultImage && (
                     <div className="absolute bottom-4 right-4 flex gap-2">
                       <a 
                        href={resultImage} 
                        download="segmented-object.png"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition-colors flex items-center gap-2"
                       >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                         </svg>
                         Download
                       </a>
                     </div>
                   )}
                 </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-center">
                <p className="font-semibold">Segmentation Failed</p>
                <p className="text-sm opacity-80">{errorMessage}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
               <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800 flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                 </div>
                 <div>
                   <h4 className="text-gray-200 font-semibold mb-1">Add (Positive)</h4>
                   <p>Click on the main object you want to extract. For example, click on a table to select it.</p>
                 </div>
               </div>
               <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800 flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                 </div>
                 <div>
                   <h4 className="text-gray-200 font-semibold mb-1">Subtract (Negative)</h4>
                   <p>Click on parts you want to remove. For example, if the selection included a chair you don't want, click the chair to subtract it.</p>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;