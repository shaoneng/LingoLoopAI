import React from 'react';
import useUserPreferences from '../../hooks/useUserPreferences';

/**
 * Slider control for numeric preferences
 */
const PreferenceSlider = ({
  type,
  key: preferenceKey,
  label,
  description,
  min,
  max,
  step = 1,
  unit = '',
  disabled = false,
  onChange
}) => {
  const { get, set, subscribe } = useUserPreferences();
  const [value, setValue] = React.useState(() => get(type, preferenceKey));

  // Subscribe to changes
  React.useEffect(() => {
    const unsubscribe = subscribe(type, preferenceKey, (newValue) => {
      setValue(newValue);
      onChange?.(newValue);
    });

    return unsubscribe;
  }, [type, preferenceKey, subscribe, onChange]);

  const handleChange = (event) => {
    const newValue = parseFloat(event.target.value);
    set(type, preferenceKey, newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="preference-slider">
      <div className="preference-info">
        <label htmlFor={`preference-${type}-${preferenceKey}`} className="preference-label">
          {label}
        </label>
        {description && (
          <p className="preference-description">{description}</p>
        )}
      </div>
      <div className="slider-container">
        <input
          id={`preference-${type}-${preferenceKey}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="preference-range-slider"
          aria-label={label}
        />
        <div className="slider-value">
          {value}{unit}
        </div>
        <div className="slider-track">
          <div
            className="slider-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PreferenceSlider;