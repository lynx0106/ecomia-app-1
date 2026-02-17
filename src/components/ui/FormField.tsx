'use client';

import { AlertCircle } from 'lucide-react';
import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg border-2 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
          ${
            error
              ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500'
              : 'border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
        `}
      />
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface FormSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
}

export function FormSelect({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required,
}: FormSelectProps) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 rounded-lg border-2 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
          ${
            error
              ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500'
              : 'border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600'
          }
        `}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
