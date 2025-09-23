import React, { useState, useRef, useEffect } from 'react';
import { useAdaptiveExperience } from '../../hooks/useAdaptiveExperience';

/**
 * Adaptive form component that adjusts complexity and guidance based on user experience level
 * Provides progressive disclosure, contextual help, and smart validation
 */
const AdaptiveForm = ({
  fields,
  onSubmit,
  onValidate,
  initialValues = {},
  submitText = '提交',
  className = '',
  adaptiveLevel = 'auto'
}) => {
  const {
    experienceLevel,
    adaptations,
    getPersonalizedHelp,
    trackInteraction,
    markFeatureDiscovered
  } = useAdaptiveExperience();

  const [formValues, setFormValues] = useState(initialValues);
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [showHelp, setShowHelp] = useState({});
  const [formProgress, setFormProgress] = useState(0);

  const formRef = useRef(null);

  // Calculate form complexity based on experience level
  const getFormComplexity = () => {
    switch (experienceLevel.id) {
      case 'beginner':
        return {
          showProgress: true,
          stepByStep: true,
          enhancedValidation: true,
          autoSave: true,
          showHints: true,
          progressiveDisclosure: true,
          fieldGroups: groupFieldsByImportance(fields, 'high')
        };
      case 'intermediate':
        return {
          showProgress: true,
          stepByStep: false,
          enhancedValidation: true,
          autoSave: false,
          showHints: true,
          progressiveDisclosure: false,
          fieldGroups: groupFieldsByImportance(fields, 'medium')
        };
      case 'advanced':
        return {
          showProgress: false,
          stepByStep: false,
          enhancedValidation: false,
          autoSave: false,
          showHints: false,
          progressiveDisclosure: false,
          fieldGroups: [fields]
        };
      case 'expert':
        return {
          showProgress: false,
          stepByStep: false,
          enhancedValidation: false,
          autoSave: false,
          showHints: false,
          progressiveDisclosure: false,
          fieldGroups: [fields],
          keyboardShortcuts: true
        };
      default:
        return {
          showProgress: true,
          stepByStep: true,
          enhancedValidation: true,
          autoSave: true,
          showHints: true,
          progressiveDisclosure: true,
          fieldGroups: groupFieldsByImportance(fields, 'high')
        };
    }
  };

  // Group fields by importance for progressive disclosure
  const groupFieldsByImportance = (fields, minImportance) => {
    const importanceOrder = { high: 3, medium: 2, low: 1 };

    return Object.entries(fields).reduce((groups, [key, field]) => {
      const importance = field.importance || 'medium';

      if (importanceOrder[importance] >= importanceOrder[minImportance]) {
        if (!groups[importance]) {
          groups[importance] = [];
        }
        groups[importance].push({ key, ...field });
      }

      return groups;
    }, {});
  };

  // Get adaptive field configuration
  const getAdaptiveFieldConfig = (field) => {
    const baseConfig = {
      showLabel: true,
      showPlaceholder: true,
      showHelp: adaptations.enhancedHelp,
      showValidation: true,
      autoValidate: true,
      ...field
    };

    switch (experienceLevel.id) {
      case 'beginner':
        return {
          ...baseConfig,
          showLabel: true,
          showPlaceholder: true,
          showHelp: true,
          showValidation: true,
          autoValidate: true,
          validationMode: 'onChange',
          showExamples: field.showExamples !== false
        };

      case 'intermediate':
        return {
          ...baseConfig,
          showLabel: true,
          showPlaceholder: true,
          showHelp: field.importance === 'high',
          showValidation: true,
          autoValidate: true,
          validationMode: 'onBlur'
        };

      case 'advanced':
        return {
          ...baseConfig,
          showLabel: true,
          showPlaceholder: false,
          showHelp: false,
          showValidation: true,
          autoValidate: false,
          validationMode: 'onSubmit'
        };

      case 'expert':
        return {
          ...baseConfig,
          showLabel: false,
          showPlaceholder: false,
          showHelp: false,
          showValidation: false,
          autoValidate: false,
          validationMode: 'onSubmit',
          compact: true
        };

      default:
        return baseConfig;
    }
  };

  // Validate field value
  const validateField = (fieldName, value, config) => {
    const errors = [];

    // Required validation
    if (config.required && !value) {
      errors.push('此字段为必填项');
    }

    // Type validation
    if (value && config.type) {
      switch (config.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push('请输入有效的邮箱地址');
          }
          break;
        case 'number':
          if (isNaN(value)) {
            errors.push('请输入有效的数字');
          }
          break;
        case 'url':
          if (!/^https?:\/\/.+/.test(value)) {
            errors.push('请输入有效的URL地址');
          }
          break;
      }
    }

    // Custom validation
    if (config.validate && typeof config.validate === 'function') {
      const customError = config.validate(value, formValues);
      if (customError) {
        errors.push(customError);
      }
    }

    // Length validation
    if (config.minLength && value && value.length < config.minLength) {
      errors.push(`最少需要 ${config.minLength} 个字符`);
    }

    if (config.maxLength && value && value.length > config.maxLength) {
      errors.push(`最多允许 ${config.maxLength} 个字符`);
    }

    return errors;
  };

  // Handle field change
  const handleFieldChange = (fieldName, value, config) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Track interaction
    trackInteraction('form_field_change', {
      field_name: fieldName,
      field_type: config.type,
      experience_level: experienceLevel.id
    });

    // Auto-validate if enabled
    if (config.autoValidate && config.validationMode === 'onChange') {
      const errors = validateField(fieldName, value, config);
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: errors
      }));
    }

    // Auto-save if enabled
    if (getFormComplexity().autoSave) {
      saveFormData();
    }

    // Update progress
    updateFormProgress();
  };

  // Handle field blur
  const handleFieldBlur = (fieldName, config) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate on blur if enabled
    if (config.autoValidate && config.validationMode === 'onBlur') {
      const errors = validateField(fieldName, formValues[fieldName], config);
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: errors
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const allErrors = {};
    let isValid = true;

    Object.entries(fields).forEach(([fieldName, config]) => {
      const errors = validateField(fieldName, formValues[fieldName], config);
      if (errors.length > 0) {
        allErrors[fieldName] = errors;
        isValid = false;
      }
    });

    setFormErrors(allErrors);
    setSubmitted(true);

    if (isValid) {
      try {
        // Custom validation if provided
        if (onValidate) {
          const customValidation = await onValidate(formValues);
          if (customValidation !== true) {
            setFormErrors(customValidation);
            setIsSubmitting(false);
            return;
          }
        }

        // Submit form
        await onSubmit(formValues);

        trackInteraction('form_submit_success', {
          form_fields: Object.keys(fields),
          experience_level: experienceLevel.id
        });

        // Reset form if successful
        setFormValues(initialValues);
        setFormErrors({});
        setTouchedFields({});
        setSubmitted(false);
      } catch (error) {
        trackInteraction('form_submit_error', {
          error: error.message,
          experience_level: experienceLevel.id
        });

        setFormErrors({
          general: [error.message || '提交失败，请重试']
        });
      }
    } else {
      trackInteraction('form_submit_validation_error', {
        error_fields: Object.keys(allErrors),
        experience_level: experienceLevel.id
      });
    }

    setIsSubmitting(false);
  };

  // Save form data (auto-save)
  const saveFormData = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('adaptive_form_data', JSON.stringify(formValues));
    }
  };

  // Load saved form data
  const loadSavedFormData = () => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('adaptive_form_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormValues(parsed);
        } catch (error) {
          console.warn('Failed to load saved form data:', error);
        }
      }
    }
  };

  // Update form progress
  const updateFormProgress = () => {
    const requiredFields = Object.entries(fields).filter(([_, config]) => config.required);
    const filledRequiredFields = requiredFields.filter(([key]) => formValues[key]);

    const progress = requiredFields.length > 0
      ? (filledRequiredFields.length / requiredFields.length) * 100
      : 0;

    setFormProgress(progress);
  };

  // Get field help text
  const getFieldHelp = (field, fieldName) => {
    if (field.help) {
      return field.help;
    }

    return getPersonalizedHelp({
      context: 'form_field',
      field_name: fieldName,
      field_type: field.type
    });
  };

  // Render form field based on type and configuration
  const renderFormField = (fieldName, field) => {
    const config = getAdaptiveFieldConfig(field);
    const value = formValues[fieldName] || '';
    const errors = formErrors[fieldName] || [];
    const isTouched = touchedFields[fieldName];
    const showError = submitted || (isTouched && errors.length > 0);

    const fieldId = `field-${fieldName}`;
    const helpId = `${fieldId}-help`;

    const commonProps = {
      id: fieldId,
      name: fieldName,
      value,
      onChange: (e) => handleFieldChange(fieldName, e.target.value, config),
      onBlur: () => handleFieldBlur(fieldName, config),
      onFocus: () => setActiveField(fieldName),
      'aria-describedby': errors.length > 0 ? `${fieldId}-error` : undefined,
      'aria-invalid': errors.length > 0,
      className: `form-field ${config.compact ? 'compact' : ''} ${showError ? 'error' : ''}`
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 4}
            placeholder={config.showPlaceholder ? field.placeholder : ''}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{field.placeholder || '请选择...'}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="checkbox-group">
            <input
              type="checkbox"
              {...commonProps}
              checked={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked, config)}
            />
            {config.showLabel && (
              <label htmlFor={fieldId}>{field.label}</label>
            )}
          </div>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option) => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name={fieldName}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value, config)}
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="file-upload">
            <input
              type="file"
              {...commonProps}
              accept={field.accept}
              multiple={field.multiple}
              onChange={(e) => handleFieldChange(fieldName, e.target.files, config)}
            />
            <label htmlFor={fieldId} className="file-upload-label">
              {value && value.length > 0
                ? `已选择 ${value.length} 个文件`
                : field.placeholder || '选择文件...'
              }
            </label>
          </div>
        );

      default:
        return (
          <input
            type={field.type || 'text'}
            {...commonProps}
            placeholder={config.showPlaceholder ? field.placeholder : ''}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
    }
  };

  // Render field with label and help
  const renderFieldWithWrapper = (fieldName, field) => {
    const config = getAdaptiveFieldConfig(field);
    const errors = formErrors[fieldName] || [];
    const showError = submitted || (touchedFields[fieldName] && errors.length > 0);
    const fieldId = `field-${fieldName}`;

    return (
      <div key={fieldName} className={`form-field-wrapper ${field.importance || 'medium'}`}>
        {config.showLabel && field.label && (
          <label htmlFor={fieldId} className="field-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
        )}

        <div className="field-input-container">
          {renderFormField(fieldName, field)}

          {config.showHelp && (
            <button
              type="button"
              className="field-help-btn"
              onClick={() => setShowHelp(prev => ({
                ...prev,
                [fieldName]: !prev[fieldName]
              }))}
              title="获取帮助"
            >
              ?
            </button>
          )}

          {showHelp[fieldName] && (
            <div className="field-help-text">
              {getFieldHelp(field, fieldName)}
            </div>
          )}

          {showError && errors.length > 0 && (
            <div className="field-errors" id={`${fieldId}-error`}>
              {errors.map((error, index) => (
                <span key={index} className="error-message">
                  {error}
                </span>
              ))}
            </div>
          )}

          {config.showExamples && field.examples && (
            <div className="field-examples">
              <strong>示例:</strong>
              <ul>
                {field.examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Form complexity
  const complexity = getFormComplexity();

  // Initialize
  useEffect(() => {
    if (complexity.autoSave) {
      loadSavedFormData();
    }
  }, [complexity.autoSave]);

  // Update progress on value changes
  useEffect(() => {
    updateFormProgress();
  }, [formValues]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`adaptive-form ${className} experience-${experienceLevel.id}`}
      noValidate
    >
      {/* Progress bar for beginners */}
      {complexity.showProgress && (
        <div className="form-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${formProgress}%` }}
            />
          </div>
          <span className="progress-text">
            {Math.round(formProgress)}% 完成
          </span>
        </div>
      )}

      {/* General errors */}
      {formErrors.general && (
        <div className="form-general-errors">
          {formErrors.general.map((error, index) => (
            <div key={index} className="error-message general">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Form fields */}
      <div className="form-fields">
        {Object.entries(complexity.fieldGroups).map(([importance, groupFields]) => (
          <div key={importance} className={`field-group importance-${importance}`}>
            {complexity.progressiveDisclosure && importance !== 'high' && (
              <div className="group-header">
                <h4>
                  {importance === 'medium' && '其他选项'}
                  {importance === 'low' && '高级设置'}
                </h4>
              </div>
            )}

            {groupFields.map(({ key, ...field }) => renderFieldWithWrapper(key, field))}
          </div>
        ))}
      </div>

      {/* Form actions */}
      <div className="form-actions">
        <button
          type="submit"
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? '提交中...' : submitText}
        </button>

        {complexity.autoSave && (
          <div className="auto-save-indicator">
            自动保存已启用
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint for experts */}
      {complexity.keyboardShortcuts && (
        <div className="keyboard-shortcuts-hint">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 快速提交
        </div>
      )}

      <style jsx>{`
        .adaptive-form {
          max-width: 600px;
          margin: 0 auto;
        }

        /* Form progress */
        .form-progress {
          margin-bottom: 2rem;
        }

        .progress-bar {
          background: #e5e7eb;
          border-radius: 4px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          background: #3b82f6;
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Form fields */
        .form-field-wrapper {
          margin-bottom: 1.5rem;
        }

        .field-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .required {
          color: #ef4444;
          margin-left: 0.25rem;
        }

        .field-input-container {
          position: relative;
        }

        .form-field {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-field.error {
          border-color: #ef4444;
        }

        .form-field.compact {
          padding: 0.5rem;
          font-size: 0.875rem;
        }

        /* Field help */
        .field-help-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid #d1d5db;
          background: white;
          color: #6b7280;
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .field-help-text {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Field errors */
        .field-errors {
          margin-top: 0.5rem;
        }

        .error-message {
          display: block;
          color: #ef4444;
          font-size: 0.875rem;
        }

        .error-message.general {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        /* Field examples */
        .field-examples {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .field-examples ul {
          margin: 0.5rem 0 0 0;
          padding-left: 1.5rem;
        }

        /* Special field types */
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .file-upload {
          position: relative;
        }

        .file-upload input[type="file"] {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .file-upload-label {
          display: block;
          padding: 0.75rem;
          border: 2px dashed #d1d5db;
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-upload-label:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        /* Form actions */
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
        }

        .submit-btn {
          padding: 0.75rem 2rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .submit-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .auto-save-indicator {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Keyboard shortcuts */
        .keyboard-shortcuts-hint {
          margin-top: 1rem;
          padding: 0.5rem;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
        }

        .keyboard-shortcuts-hint kbd {
          background: white;
          padding: 0.125rem 0.25rem;
          border-radius: 2px;
          border: 1px solid #d1d5db;
          font-family: monospace;
        }

        /* Experience level adaptations */
        .adaptive-form.experience-beginner {
          /* More spacing for beginners */
        }

        .adaptive-form.experience-beginner .form-field-wrapper {
          margin-bottom: 2rem;
        }

        .adaptive-form.experience-expert .form-field-wrapper {
          margin-bottom: 1rem;
        }

        .adaptive-form.experience-expert .field-label {
          display: none;
        }

        /* Progressive disclosure */
        .field-group {
          margin-bottom: 1.5rem;
        }

        .group-header {
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .group-header h4 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
        }

        /* Importance levels */
        .field-wrapper.importance-high {
          /* High importance fields get priority */
        }

        .field-wrapper.importance-medium {
          /* Medium importance */
        }

        .field-wrapper.importance-low {
          /* Low importance fields can be hidden in progressive disclosure */
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .adaptive-form {
            padding: 1rem;
          }

          .form-actions {
            flex-direction: column;
            gap: 1rem;
          }

          .field-help-btn {
            top: 0.75rem;
          }
        }
      `}</style>
    </form>
  );
};

export default AdaptiveForm;