import React from 'react';

const UploadProgress = ({ steps, currentStepIndex, progress }) => {
  return (
    <div className="upload-progress">
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step ${index <= currentStepIndex ? 'active' : ''} ${index === currentStepIndex ? 'current' : ''}`}
          >
            <div className="step-icon">{step.icon}</div>
            <div className="step-label">{step.label}</div>
            {index < steps.length - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>

      {progress > 0 && progress < 100 && (
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};

export default UploadProgress;