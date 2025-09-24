/**
 * Feedback Button Component
 * Floating action button for quick feedback submission
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackButton = ({ onClick, unreadCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide tooltip after 5 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  // Show tooltip on first visit
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('lingoloop.feedback.tooltip.seen');
    if (!hasSeenTooltip) {
      setShowTooltip(true);
      localStorage.setItem('lingoloop.feedback.tooltip.seen', 'true');
    }
  }, []);

  const quickActions = [
    {
      id: 'bug',
      label: '报告错误',
      icon: '🐛',
      color: 'bg-red-500',
      hoverColor: 'bg-red-600'
    },
    {
      id: 'suggestion',
      label: '提建议',
      icon: '💡',
      color: 'bg-blue-500',
      hoverColor: 'bg-blue-600'
    },
    {
      id: 'rating',
      label: '评分',
      icon: '⭐',
      color: 'bg-yellow-500',
      hoverColor: 'bg-yellow-600'
    },
    {
      id: 'help',
      label: '需要帮助',
      icon: '❓',
      color: 'bg-green-500',
      hoverColor: 'bg-green-600'
    }
  ];

  const handleQuickAction = (actionId) => {
    setIsExpanded(false);
    onClick({ type: actionId });
  };

  const handleMainClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      setShowTooltip(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            有任何问题或建议？告诉我们！
            <div className="absolute bottom-0 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900 transform translate-y-full"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <AnimatePresence>
        {isExpanded && (
          <div className="absolute bottom-full right-0 mb-4 space-y-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-end justify-end"
              >
                <button
                  onClick={() => handleQuickAction(action.id)}
                  className={`${action.color} hover:${action.hoverColor} text-white px-4 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 mr-2 flex items-center space-x-2`}
                >
                  <span>{action.icon}</span>
                  <span className="font-medium">{action.label}</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleMainClick}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all ${
          isExpanded
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white relative`}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              ✕
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              💬
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread Indicator */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}

        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-white opacity-30">
          <div className={`absolute inset-0 rounded-full bg-white ${
            isExpanded ? 'animate-ping' : ''
          }`}></div>
        </div>
      </motion.button>

      {/* Pulse Animation for new features */}
      <AnimatePresence>
        {!isExpanded && unreadCount === 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-blue-300"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackButton;