import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

type InputFieldProps = BaseFieldProps & {
  as?: 'input';
} & InputHTMLAttributes<HTMLInputElement>;

type SelectFieldProps = BaseFieldProps & {
  as: 'select';
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

type TextareaFieldProps = BaseFieldProps & {
  as: 'textarea';
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

const inputClasses =
  'w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange transition-all duration-200';

const errorInputClasses =
  'w-full px-4 py-3 bg-dark-700 border border-red-500/50 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200';

export default function FormField(props: FormFieldProps) {
  const { label, error, hint, required, className = '', as = 'input', ...rest } = props;
  const fieldClasses = error ? errorInputClasses : inputClasses;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-dark-400 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {as === 'select' ? (
        <select className={`${fieldClasses} appearance-none`} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {(props as SelectFieldProps).children}
        </select>
      ) : as === 'textarea' ? (
        <textarea className={fieldClasses} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input className={fieldClasses} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-dark-500">{hint}</p>}
    </div>
  );
}
