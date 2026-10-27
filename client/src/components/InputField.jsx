import { useId } from 'react';

function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  required = false,
  autoComplete,
  placeholder,
  disabled = false,
  ...rest
}) {
  const generatedId = useId();
  const inputId = `field-${name || generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`input-field${error ? ' input-field--error' : ''}`}>
      <label className="input-field__label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="input-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        className="input-field__control"
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && (
        <p className="input-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="input-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default InputField;
