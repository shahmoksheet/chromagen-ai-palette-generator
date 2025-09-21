import React from 'react';
import { useScreenSize, useMobilePerformance, useViewportHeight, CONTAINER_CLASSES } from '../utils/responsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  container?: keyof typeof CONTAINER_CLASSES;
  className?: string;
}

/**
 * Responsive layout wrapper that provides consistent spacing and container sizing
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  container = 'constrained',
  className = '',
}) => {
  const { isMobile, isTablet } = useScreenSize();
  useMobilePerformance();
  useViewportHeight();

  const containerClasses = CONTAINER_CLASSES[container];
  
  return (
    <div className={`${containerClasses} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;