/**
 * Survey Modal Component
 * Displays interactive surveys for user feedback collection
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserFeedback } from '../../hooks/useUserFeedback';

const SurveyModal = ({ survey, isOpen, onClose, onSubmit, onCancel }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = survey?.questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (survey?.questions?.length || 0) - 1;
  const progress = survey?.questions?.length ? ((currentQuestionIndex + 1) / survey.questions.length) * 100 : 0;

  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestionIndex(0);
      setResponses({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleResponseChange = (questionId, response) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit(survey.id, responses);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentQuestionValid = () => {
    if (!currentQuestion) return true;

    if (currentQuestion.required) {
      const response = responses[currentQuestion.id];
      return response !== undefined && response !== null && response !== '';
    }

    return true;
  };

  const canProceed = isCurrentQuestionValid();

  const renderQuestion = (question) => {
    const response = responses[question.id];

    switch (question.type) {
      case 'rating':
        return (
          <div className="space-y-4">
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleResponseChange(question.id, rating)}
                  className={`w-12 h-12 rounded-full border-2 text-lg font-bold transition-all ${
                    response === rating
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>非常不满意</span>
              <span>非常满意</span>
            </div>
          </div>
        );

      case 'nps':
        return (
          <div className="space-y-4">
            <div className="flex justify-center space-x-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleResponseChange(question.id, rating)}
                  className={`w-10 h-10 rounded-md border-2 text-sm font-bold transition-all ${
                    response === rating
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>不太可能</span>
              <span>极有可能</span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleResponseChange(question.id, option)}
                className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                  response === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'matrix':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2"></th>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <th key={rating} className="text-center p-2 text-sm">
                        {rating}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {question.features.map((feature) => (
                    <tr key={feature}>
                      <td className="p-2 text-sm font-medium">{feature}</td>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <td key={rating} className="text-center p-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentResponse = response || {};
                              handleResponseChange(question.id, {
                                ...currentResponse,
                                [feature]: rating
                              });
                            }}
                            className={`w-8 h-8 rounded-full border-2 text-sm transition-all ${
                              response?.[feature] === rating
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {rating}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>非常不满意</span>
              <span>非常满意</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.placeholder || '请输入你的回答...'}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        );

      default:
        return null;
    }
  };

  if (!isOpen || !survey) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{survey.name}</h2>
              <p className="text-green-100 mt-1">{survey.description}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>问题 {currentQuestionIndex + 1} / {survey.questions?.length}</span>
              <span>{Math.floor(progress)}% 完成</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {currentQuestion && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {currentQuestion.question}
                      {currentQuestion.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                    {currentQuestion.required && (
                      <p className="text-sm text-gray-600">此问题为必填项</p>
                    )}
                  </div>

                  <div>
                    {renderQuestion(currentQuestion)}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              退出调查
            </button>

            <div className="flex items-center space-x-3">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  上一题
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed || isSubmitting}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>提交中...</span>
                  </div>
                ) : isLastQuestion ? (
                  '完成调查'
                ) : (
                  '下一题'
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SurveyModal;