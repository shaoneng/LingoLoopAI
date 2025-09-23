/**
 * Feedback Modal Component
 * Allows users to submit feedback and bug reports
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FEEDBACK_TYPES,
  FEEDBACK_CATEGORIES,
  FEEDBACK_PRIORITIES
} from '../../utils/userFeedback';

const FeedbackModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    type: initialData.type || FEEDBACK_TYPES.GENERAL_FEEDBACK,
    category: initialData.category || FEEDBACK_CATEGORIES.OTHER,
    priority: initialData.priority || FEEDBACK_PRIORITIES.MEDIUM,
    title: initialData.title || '',
    message: initialData.message || '',
    email: initialData.email || '',
    attachments: []
  });

  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    }

    if (!formData.message.trim()) {
      newErrors.message = '描述不能为空';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      // Reset form
      setFormData({
        type: FEEDBACK_TYPES.GENERAL_FEEDBACK,
        category: FEEDBACK_CATEGORIES.OTHER,
        priority: FEEDBACK_PRIORITIES.MEDIUM,
        title: '',
        message: '',
        email: '',
        attachments: []
      });
      setErrors({});
      onClose();
    }
  };

  const getTypeOptions = () => [
    { value: FEEDBACK_TYPES.BUG_REPORT, label: '错误报告', icon: '🐛' },
    { value: FEEDBACK_TYPES.FEATURE_REQUEST, label: '功能请求', icon: '✨' },
    { value: FEEDBACK_TYPES.USABILITY_ISSUE, label: '易用性问题', icon: '🎨' },
    { value: FEEDBACK_TYPES.PERFORMANCE_ISSUE, label: '性能问题', icon: '⚡' },
    { value: FEEDBACK_TYPES.CONTENT_FEEDBACK, label: '内容反馈', icon: '📚' },
    { value: FEEDBACK_TYPES.GENERAL_FEEDBACK, label: '一般反馈', icon: '💭' },
    { value: FEEDBACK_TYPES.RATING, label: '评分', icon: '⭐' },
    { value: FEEDBACK_TYPES.SUGGESTION, label: '建议', icon: '💡' }
  ];

  const getCategoryOptions = () => [
    { value: FEEDBACK_CATEGORIES.AUDIO_UPLOAD, label: '音频上传' },
    { value: FEEDBACK_CATEGORIES.TRANSCRIPTION, label: '转录功能' },
    { value: FEEDBACK_CATEGORIES.ANALYSIS, label: '分析功能' },
    { value: FEEDBACK_CATEGORIES.PLAYBACK, label: '播放功能' },
    { value: FEEDBACK_CATEGORIES.UI_UX, label: '界面设计' },
    { value: FEEDBACK_CATEGORIES.PERFORMANCE, label: '性能' },
    { value: FEEDBACK_CATEGORIES.CONTENT, label: '内容' },
    { value: FEEDBACK_CATEGORIES.ACCOUNT, label: '账户' },
    { value: FEEDBACK_CATEGORIES.BILLING, label: '计费' },
    { value: FEEDBACK_CATEGORIES.MOBILE, label: '移动端' },
    { value: FEEDBACK_CATEGORIES.DESKTOP, label: '桌面端' },
    { value: FEEDBACK_CATEGORIES.OTHER, label: '其他' }
  ];

  const getPriorityOptions = () => [
    { value: FEEDBACK_PRIORITIES.LOW, label: '低', color: 'bg-green-500' },
    { value: FEEDBACK_PRIORITIES.MEDIUM, label: '中', color: 'bg-yellow-500' },
    { value: FEEDBACK_PRIORITIES.HIGH, label: '高', color: 'bg-orange-500' },
    { value: FEEDBACK_PRIORITIES.CRITICAL, label: '紧急', color: 'bg-red-500' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">反馈建议</h2>
              <p className="text-blue-100 mt-1">帮助我们改进 LingoLoopAI</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                反馈类型
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {getTypeOptions().map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('type', option.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.type === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {getCategoryOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <div className="flex space-x-2">
                  {getPriorityOptions().map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('priority', option.value)}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.priority === option.value
                          ? `${option.color} text-white border-transparent`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="简要描述你的反馈..."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                详细描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="请详细描述你的反馈、遇到的问题或建议..."
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-1">{errors.message}</p>
              )}
            </div>

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>高级选项</span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        联系邮箱（可选）
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your@email.com"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        附件（可选）
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600 text-sm">
                          拖拽文件到此处或{' '}
                          <button type="button" className="text-blue-500 hover:text-blue-600">
                            点击上传
                          </button>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          支持 PNG, JPG, PDF 文件，最大 10MB
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                你的反馈将帮助我们改进产品
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>提交中...</span>
                    </div>
                  ) : (
                    '提交反馈'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;