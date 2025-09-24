import React from 'react';
import useUserPreferences from '../../hooks/useUserPreferences';

/**
 * Select dropdown for preference options
 */
const PreferenceSelect = ({
  type,
  key: preferenceKey,
  label,
  description,
  options,
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
    const newValue = event.target.value;
    set(type, preferenceKey, newValue);
  };

  return (
    <div className="preference-select">
      <div className="preference-info">
        <label htmlFor={`preference-${type}-${preferenceKey}`} className="preference-label">
          {label}
        </label>
        {description && (
          <p className="preference-description">{description}</p>
        )}
      </div>
      <select
        id={`preference-${type}-${preferenceKey}`}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="preference-dropdown"
        aria-label={label}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PreferenceSelect;