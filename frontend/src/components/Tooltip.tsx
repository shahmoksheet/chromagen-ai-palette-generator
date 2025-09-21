import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
  maxWidth = '300px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.pageXOffset;
        const scrollY = window.pageYOffset;
        
        let x = 0;
        let y = 0;
        
        switch (position) {
          case 'top':
            x = rect.left + scrollX + rect.width / 2;
            y = rect.top + scrollY - 10;
            break;
          case 'bottom':
            x = rect.left + scrollX + rect.width / 2;
            y = rect.bottom + scrollY + 10;
            break;
          case 'left':
            x = rect.left + scrollX - 10;
            y = rect.top + scrollY + rect.height / 2;
            break;
          case 'right':
            x = rect.right + scrollX + 10;
            y = rect.top + scrollY + rect.height / 2;
            break;
        }
        
        setTooltipPosition({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = `
      absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg
      pointer-events-none transform transition-all duration-200 ease-in-out
      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `;
    
    const positionClasses = {
      top: '-translate-x-1/2 -translate-y-full',
      bottom: '-translate-x-1/2 translate-y-0',
      left: '-translate-x-full -translate-y-1/2',
      right: 'translate-x-0 -translate-y-1/2'
    };
    
    return `${baseClasses} ${positionClasses[position]} ${className}`;
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
    
    const arrowPositions = {
      top: 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
      left: 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2',
      right: 'right-full top-1/2 translate-x-1/2 -translate-y-1/2'
    };
    
    return `${baseClasses} ${arrowPositions[position]}`;
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && createPortal(
        <div
          className={getTooltipClasses()}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            maxWidth
          }}
        >
          <div className={getArrowClasses()} />
          {content}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;