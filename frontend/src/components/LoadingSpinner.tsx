import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {message && (
        <motion.p
          className={`text-gray-600 text-center ${
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;