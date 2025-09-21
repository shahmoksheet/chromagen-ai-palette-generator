import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, HelpCircle, Play, Palette } from 'lucide-react';
import { useScreenSize, useMobileInteractions } from '../utils/responsive';

interface MobileNavigationProps {
  onHelpClick: () => void;
  onTourClick: () => void;
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  onHelpClick,
  onTourClick,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useScreenSize();
  const { getTouchProps } = useMobileInteractions();

  if (!isMobile) return null;

  const menuItems = [
    {
      label: 'Features',
      href: '#features',
      icon: <Palette className="w-5 h-5" />,
    },
    {
      label: 'About',
      href: '#about',
      icon: <Palette className="w-5 h-5" />,
    },
    {
      label: 'Help',
      onClick: () => {
        onHelpClick();
        setIsOpen(false);
      },
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      label: 'Take Tour',
      onClick: () => {
        onTourClick();
        setIsOpen(false);
      },
      icon: <Play className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        {...getTouchProps(() => setIsOpen(true))}
        className={`md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${className}`}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
                  <h2 className="text-xl font-bold text-gray-900">ChromaGen</h2>
                </div>
                <button
                  {...getTouchProps(() => setIsOpen(false))}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="p-6">
                <ul className="space-y-4">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.icon}
                          <span className="text-lg">{item.label}</span>
                        </a>
                      ) : (
                        <button
                          {...getTouchProps(item.onClick)}
                          className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors w-full text-left"
                        >
                          {item.icon}
                          <span className="text-lg">{item.label}</span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  AI-Powered Color Palette Generator
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;