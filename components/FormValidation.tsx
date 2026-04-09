import React from 'react';

interface FormValidationProps {
  fieldName: string;
  errorMessage: string | null;
  touched: boolean;
  required?: boolean;
}

const FormValidation: React.FC<FormValidationProps> = ({ fieldName, errorMessage, touched, required }) => {
  if (!errorMessage || !touched) return null;
  return (
    <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <span aria-hidden="true">❌</span>
      <span>{errorMessage}</span>
    </div>
  );
};

export default FormValidation;
