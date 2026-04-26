import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import styles from './FormField.module.scss';

type BaseProps = {
  label: string;
  error?: string;
  required?: boolean;
  id?: string;
  children?: ReactNode;
};

type InputProps = BaseProps & {
  as?: 'input';
  registration: UseFormRegisterReturn;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

type SelectProps = BaseProps & {
  as: 'select';
  registration: UseFormRegisterReturn;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'>;

type TextareaProps = BaseProps & {
  as: 'textarea';
  registration: UseFormRegisterReturn;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>;

type Props = InputProps | SelectProps | TextareaProps;

export function FormField(props: Props) {
  const { label, error, required, id, registration, as = 'input', ...rest } = props;
  const fieldId = id ?? registration.name;

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>

      {as === 'select' ? (
        <select
          id={fieldId}
          {...registration}
          {...(rest as Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'>)}
          className={`form-select ${error ? 'is-invalid' : ''}`}
        >
          {(props as SelectProps).children}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          id={fieldId}
          {...registration}
          {...(rest as Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>)}
          className={`form-control ${error ? 'is-invalid' : ''}`}
        />
      ) : (
        <input
          id={fieldId}
          {...registration}
          {...(rest as Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>)}
          className={`form-control ${error ? 'is-invalid' : ''}`}
        />
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
