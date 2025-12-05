import React, { useCallback } from 'react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [onImageSelected]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [onImageSelected]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer bg-gray-900/50 group"
    >
      <div className="p-4 bg-gray-800 rounded-full mb-4 group-hover:bg-gray-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white">Upload an image</h3>
      <p className="text-gray-400 mb-6 text-center">Drag and drop or click to browse</p>
      
      <label className="relative">
        <span className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer">
          Choose File
        </span>
        <input 
          type="file" 
          accept="image/*" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default ImageUploader;