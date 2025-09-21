import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { colorAPI } from '../utils/api';
import { GenerationResponse } from '../types/api';

interface ImageUploadPanelProps {
  onGenerated: (response: GenerationResponse) => void;
  isLoading?: boolean;
}

const ImageUploadPanel: React.FC<ImageUploadPanelProps> = ({ onGenerated, isLoading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => 
      colorAPI.generateFromImage(file, `session_${Date.now()}`, undefined, setUploadProgress),
    onSuccess: (response: GenerationResponse) => {
      toast.success('Palette generated from image!');
      onGenerated(response);
      setPreview(null);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast.error(error.error || 'Failed to process image');
      setUploadProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadMutation.mutate(file);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removePreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isProcessing = uploadMutation.isPending || isLoading;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Generate from Image
        </h3>
        <p className="text-gray-600">
          Upload an image to extract its color palette and generate harmonious variations
        </p>
      </div>

      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {dragActive ? 'Drop your image here' : 'Upload an image'}
            </h4>
            <p className="text-gray-500 mb-4">
              Drag and drop or click to select
            </p>
            <div className="text-sm text-gray-400">
              Supports JPEG, PNG, WebP, GIF • Max 10MB
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
            disabled={isProcessing}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            {!isProcessing && (
              <button
                onClick={removePreview}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing image...'}
                </span>
                <span className="text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isProcessing && (
            <div className="flex gap-3">
              <button
                onClick={() => uploadMutation.mutate(fileInputRef.current?.files?.[0]!)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Generate Palette
              </button>
              <button
                onClick={removePreview}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for best results:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use images with clear, distinct colors</li>
          <li>• High contrast images work better</li>
          <li>• Avoid images with too many similar tones</li>
          <li>• Landscape and nature photos often produce great palettes</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUploadPanel;