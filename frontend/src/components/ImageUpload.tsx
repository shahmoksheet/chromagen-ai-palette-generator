import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  FileImage,
  Info
} from 'lucide-react';
import { ImageGenerationRequest, ImageValidationResult, ImageUploadProgress } from '../types/api';

interface ImageUploadProps {
  onImageUpload: (request: ImageGenerationRequest) => Promise<void>;
  isLoading: boolean;
  acceptedFormats?: string[];
  maxSize?: number; // in bytes
  maxDimensions?: { width: number; height: number };
  onValidationError?: (errors: string[]) => void;
  onProgress?: (progress: ImageUploadProgress) => void;
  className?: string;
}

const DEFAULT_ACCEPTED_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_DIMENSIONS = { width: 4000, height: 4000 };

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  isLoading,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  maxSize = DEFAULT_MAX_SIZE,
  maxDimensions = DEFAULT_MAX_DIMENSIONS,
  onValidationError,
  onProgress: _onProgress,
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate image file
  const validateImage = useCallback(async (file: File): Promise<ImageValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported. Please use: ${acceptedFormats.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`);
    }

    // Check image dimensions
    const dimensions = await getImageDimensions(file);
    if (dimensions) {
      if (dimensions.width > maxDimensions.width || dimensions.height > maxDimensions.height) {
        errors.push(`Image dimensions (${dimensions.width}x${dimensions.height}) exceed maximum allowed (${maxDimensions.width}x${maxDimensions.height})`);
      }
      
      if (dimensions.width < 100 || dimensions.height < 100) {
        warnings.push('Image is quite small. Consider using a larger image for better color extraction.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        size: file.size,
        type: file.type,
        dimensions: dimensions || undefined,
      },
    };
  }, [acceptedFormats, maxSize, maxDimensions]);

  // Get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    const validation = await validateImage(file);
    
    setValidationResult(validation);
    
    if (!validation.isValid) {
      onValidationError?.(validation.errors);
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
  }, [validateImage, onValidationError]);

  // Dropzone configuration
  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneIsDragActive,
    isDragReject,
  } = useDropzone({
    onDrop: handleFileSelect,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    maxFiles: 1,
    disabled: isLoading,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !validationResult?.isValid) return;

    const request: ImageGenerationRequest = {
      image: selectedFile,
      userId: generateSessionId(),
      options: {
        colorCount: 6,
        harmonyType: 'complementary',
        accessibilityLevel: 'AA',
        includeNeutrals: true,
      },
    };

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev) return { loaded: 0, total: selectedFile.size, percentage: 0 };
          const newLoaded = Math.min(prev.loaded + selectedFile.size * 0.1, selectedFile.size);
          return {
            loaded: newLoaded,
            total: selectedFile.size,
            percentage: Math.round((newLoaded / selectedFile.size) * 100),
          };
        });
      }, 200);

      await onImageUpload(request);
      clearInterval(progressInterval);
      setUploadProgress({ loaded: selectedFile.size, total: selectedFile.size, percentage: 100 });
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(null);
    }
  }, [selectedFile, validationResult, onImageUpload]);

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationResult(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Generate session ID
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const dropzoneProps = getRootProps();

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Main Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {!selectedFile ? (
          // Upload Zone
          <div
            {...dropzoneProps}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
              ${dropzoneIsDragActive || isDragActive
                ? 'border-purple-400 bg-purple-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isDragReject ? 'border-red-400 bg-red-50' : ''}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            <AnimatePresence mode="wait">
              {dropzoneIsDragActive ? (
                <motion.div
                  key="drag-active"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex flex-col items-center space-y-4"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-purple-700">Drop your image here</p>
                    <p className="text-sm text-purple-600">Release to upload</p>
                  </div>
                </motion.div>
              ) : isDragReject ? (
                <motion.div
                  key="drag-reject"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex flex-col items-center space-y-4"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-red-700">Invalid file type</p>
                    <p className="text-sm text-red-600">Please use a supported image format</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex flex-col items-center space-y-4"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Upload an image</p>
                    <p className="text-sm text-gray-600">
                      Drag and drop or click to browse
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isLoading}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Choose File
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl"
                >
                  <div className="flex items-center space-x-3 text-purple-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-medium">Processing image...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          // Preview and Upload
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <FileImage className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Image Preview</h3>
              </div>
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                title="Remove image"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Preview */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image Preview */}
                <div className="flex-1">
                  <div className="relative bg-gray-50 rounded-xl overflow-hidden">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* File Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">File Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium truncate ml-2">{selectedFile.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{selectedFile.type}</span>
                      </div>
                      {validationResult?.fileInfo?.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dimensions:</span>
                          <span className="font-medium">
                            {validationResult.fileInfo.dimensions.width} × {validationResult.fileInfo.dimensions.height}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Validation Results */}
                  {validationResult && (
                    <div className="space-y-2">
                      {validationResult.isValid ? (
                        <div className="flex items-center space-x-2 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">File is valid</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <div key={index} className="flex items-start space-x-2 text-red-700">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{error}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start space-x-2 text-amber-700">
                          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {uploadProgress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Processing...</span>
                        <span className="font-medium">{uploadProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress.percentage}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="pt-2">
                    <motion.button
                      onClick={handleUpload}
                      disabled={!validationResult?.isValid || isLoading}
                      whileHover={validationResult?.isValid && !isLoading ? { scale: 1.02 } : {}}
                      whileTap={validationResult?.isValid && !isLoading ? { scale: 0.98 } : {}}
                      className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                        validationResult?.isValid && !isLoading
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Palette...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Generate Palette</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Format Information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center"
      >
        <p className="text-sm text-gray-600">
          Supported formats: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')} • 
          Max size: {formatFileSize(maxSize)} • 
          Max dimensions: {maxDimensions.width}×{maxDimensions.height}
        </p>
      </motion.div>
    </div>
  );
};

export default ImageUpload;