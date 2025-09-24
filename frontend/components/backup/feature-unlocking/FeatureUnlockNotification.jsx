/**
 * Feature Unlock Notification Component
 * Shows notifications when new features are unlocked or achievements are earned
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FeatureUnlockNotification = ({
  showUnlockNotification,
  currentUnlock,
  currentAchievement,
  onClose,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (showUnlockNotification && (currentUnlock || currentAchievement)) {
      setIsVisible(true);

      // Auto-hide after 5 seconds if not hovered
      const timer = setTimeout(() => {
        if (!isHovered) {
          setIsVisible(false);
          setTimeout(() => {
            onClose();
          }, 300);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showUnlockNotification, currentUnlock, currentAchievement, isHovered, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleDismiss = () => {
    onDismiss();
  };

  if (!showUnlockNotification || (!currentUnlock && !currentAchievement)) {
    return null;
  }

  const isAchievement = !!currentAchievement;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className={`relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-lg ${
            isAchievement
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
              : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
          }`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
            </div>

            {/* Content */}
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isAchievement ? 'bg-white/20' : 'bg-white/20'
                  }`}>
                    <span className="text-2xl">
                      {isAchievement ? currentAchievement.icon : '🎉'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {isAchievement ? '成就解锁!' : '新功能解锁!'}
                    </h3>
                    <p className="text-sm opacity-90">
                      {isAchievement ? '恭喜你获得新成就' : '恭喜你解锁了新功能'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Main Content */}
              <div className="mb-4">
                <h4 className="text-xl font-bold mb-2">
                  {isAchievement ? currentAchievement.name : currentUnlock.name}
                </h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  {isAchievement ? currentAchievement.description : currentUnlock.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isAchievement
                      ? 'bg-white/20 hover:bg-white/30'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  查看详情
                </button>
                <div className="text-xs opacity-75">
                  点击任意位置关闭
                </div>
              </div>
            </div>

            {/* Animated Border */}
            <div className={`absolute inset-0 rounded-2xl border-2 ${
              isAchievement ? 'border-yellow-300' : 'border-blue-300'
            } opacity-50`}>
              <div className={`absolute inset-0 rounded-2xl border-2 ${
                isAchievement ? 'border-yellow-300' : 'border-blue-300'
              } opacity-50 animate-ping`}></div>
            </div>

            {/* Sparkle Effects */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full animate-ping"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full animate-ping delay-300"></div>
            <div className="absolute top-4 -right-4 w-3 h-3 bg-white rounded-full animate-ping delay-700"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeatureUnlockNotification;