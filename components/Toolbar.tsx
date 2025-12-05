import React from 'react';
import { PointType, AppState } from '../types';

interface ToolbarProps {
  currentMode: PointType;
  onModeChange: (mode: PointType) => void;
  onClear: () => void;
  onProcess: () => void;
  appState: AppState;
  hasPoints: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  currentMode, 
  onModeChange, 
  onClear, 
  onProcess,
  appState,
  hasPoints
}) => {
  const isProcessing = appState === AppState.PROCESSING;

  return (
    <div className="flex flex-wrap items-center gap-4 bg-gray-800 p-3 rounded-2xl shadow-xl border border-gray-700">
      
      {/* Mode Switcher */}
      <div className="flex bg-gray-900 rounded-xl p-1">
        <button
          onClick={() => onModeChange(PointType.POSITIVE)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            currentMode === PointType.POSITIVE 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          disabled={isProcessing}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
        <button
          onClick={() => onModeChange(PointType.NEGATIVE)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            currentMode === PointType.NEGATIVE 
              ? 'bg-red-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          disabled={isProcessing}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          Subtract
        </button>
      </div>

      <div className="h-8 w-[1px] bg-gray-700 mx-2 hidden sm:block"></div>

      {/* Actions */}
      <button
        onClick={onClear}
        disabled={isProcessing || !hasPoints}
        className="px-4 py-2 text-sm text-gray-300 hover:text-white font-medium hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Reset Points
      </button>

      <button
        onClick={onProcess}
        disabled={isProcessing || !hasPoints}
        className={`ml-auto flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all ${
          isProcessing 
            ? 'bg-gray-600 cursor-wait' 
            : hasPoints ? 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25' : 'bg-gray-700 opacity-50 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Segmenting...
          </>
        ) : (
          <>
            <span>Run Segment</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};

export default Toolbar;