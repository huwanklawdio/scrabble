import { useState, useCallback, useRef, useEffect } from 'react';

// ================================
// Form Types
// ================================

export interface FormField<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
}

export interface FormState<T extends Record<string, any> = Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitAttempted: boolean;
  submitCount: number;
}

export interface ValidationRule<T = any> {
  validate: (value: T, formData: Record<string, any>) => string | null;
  message?: string;
}

export interface FieldConfig<T = any> {
  initialValue: T;
  validationRules?: ValidationRule<T>[];
  required?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormConfig<T extends Record<string, any> = Record<string, any>> {
  fields: { [K in keyof T]: FieldConfig<T[K]> };
  validateOnSubmit?: boolean;
  validateOnChange?: boolean;
  resetOnSubmit?: boolean;
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
}

// ================================
// Validation Helpers
// ================================

export const ValidationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    validate: (value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    },
    message
  }),
  
  minLength: (minLen: number, message?: string): ValidationRule<string> => ({
    validate: (value) => {
      if (typeof value === 'string' && value.length < minLen) {
        return message || `Must be at least ${minLen} characters`;
      }
      return null;
    },
    message
  }),
  
  maxLength: (maxLen: number, message?: string): ValidationRule<string> => ({
    validate: (value) => {
      if (typeof value === 'string' && value.length > maxLen) {
        return message || `Must be no more than ${maxLen} characters`;
      }
      return null;
    },
    message
  }),
  
  pattern: (regex: RegExp, message?: string): ValidationRule<string> => ({
    validate: (value) => {
      if (typeof value === 'string' && !regex.test(value)) {
        return message || 'Invalid format';
      }
      return null;
    },
    message
  }),
  
  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value === 'string' && value && !emailRegex.test(value)) {
        return message;
      }
      return null;
    },
    message
  }),
  
  custom: <T>(validator: (value: T, formData: Record<string, any>) => boolean, message: string): ValidationRule<T> => ({
    validate: (value, formData) => {
      return validator(value, formData) ? null : message;
    },
    message
  })
};

// ================================
// Hook Interface
// ================================

export interface FormStateHook<T extends Record<string, any> = Record<string, any>> {
  // Form State
  formState: FormState<T>;
  
  // Field Management
  getFieldProps: (fieldName: keyof T) => {
    value: T[keyof T];
    onChange: (value: T[keyof T]) => void;
    onBlur: () => void;
    error: string | null;
    touched: boolean;
    dirty: boolean;
    valid: boolean;
  };
  
  setFieldValue: (fieldName: keyof T, value: T[keyof T]) => void;
  setFieldError: (fieldName: keyof T, error: string | null) => void;
  setFieldTouched: (fieldName: keyof T, touched?: boolean) => void;
  
  // Form Operations
  validateField: (fieldName: keyof T) => boolean;
  validateForm: () => boolean;
  reset: () => void;
  resetField: (fieldName: keyof T) => void;
  
  // Submit Handling
  handleSubmit: (onSubmit: (data: T) => void | Promise<void>) => (event?: React.FormEvent) => Promise<void>;
  setSubmitting: (submitting: boolean) => void;
  
  // Utilities
  getFormData: () => T;
  setFormData: (data: Partial<T>) => void;
  isDirty: () => boolean;
  isValid: () => boolean;
}

// ================================
// Form State Hook
// ================================

export function useFormState<T extends Record<string, any> = Record<string, any>>(
  config: FormConfig<T>,
  onSubmit?: (data: T) => void | Promise<void>,
  onAutoSave?: (data: T) => void
): FormStateHook<T> {
  
  // ================================
  // State Management
  // ================================
  
  const [formState, setFormState] = useState<FormState<T>>(() => {
    const fields = {} as { [K in keyof T]: FormField<T[K]> };
    
    for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
      fields[fieldName as keyof T] = {
        value: fieldConfig.initialValue,
        error: null,
        touched: false,
        dirty: false,
        valid: true
      };
    }
    
    return {
      fields,
      isValid: true,
      isDirty: false,
      isSubmitting: false,
      submitAttempted: false,
      submitCount: 0
    };
  });
  
  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  
  // ================================
  // Utility Functions (defined first to avoid circular references)
  // ================================
  
  const getFormData = useCallback((): T => {
    return Object.keys(formState.fields).reduce((acc, key) => {
      acc[key as keyof T] = formState.fields[key as keyof T].value;
      return acc;
    }, {} as T);
  }, [formState.fields]);
  
  // ================================
  // Validation Functions
  // ================================
  
  const validateFieldValue = useCallback(<K extends keyof T>(
    fieldName: K,
    value: T[K],
    formData: T
  ): string | null => {
    const fieldConfig = config.fields[fieldName];
    if (!fieldConfig.validationRules) return null;
    
    // Check required first
    if (fieldConfig.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }
    
    // Run other validation rules
    for (const rule of fieldConfig.validationRules) {
      const error = rule.validate(value, formData);
      if (error) return error;
    }
    
    return null;
  }, [config.fields]);
  
  const validateField = useCallback((fieldName: keyof T): boolean => {
    const currentValue = formState.fields[fieldName].value;
    const formData = getFormData();
    const error = validateFieldValue(fieldName, currentValue, formData);
    
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          error,
          valid: !error
        }
      }
    }));
    
    return !error;
  }, [formState.fields, getFormData, validateFieldValue]);
  
  const validateForm = useCallback((): boolean => {
    const formData = getFormData();
    let isFormValid = true;
    const newFields = { ...formState.fields };
    
    for (const fieldName of Object.keys(config.fields) as (keyof T)[]) {
      const value = formState.fields[fieldName].value;
      const error = validateFieldValue(fieldName, value, formData);
      
      newFields[fieldName] = {
        ...newFields[fieldName],
        error,
        valid: !error,
        touched: true
      };
      
      if (error) isFormValid = false;
    }
    
    setFormState(prev => ({
      ...prev,
      fields: newFields,
      isValid: isFormValid
    }));
    
    return isFormValid;
  }, [formState.fields, config.fields, getFormData, validateFieldValue]);
  
  // ================================
  // Field Management
  // ================================
  
  const setFieldValue = useCallback(<K extends keyof T>(fieldName: K, value: T[K]) => {
    setFormState(prev => {
      const newFields = {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          value,
          dirty: true
        }
      };
      
      // Validate on change if enabled
      const fieldConfig = config.fields[fieldName];
      if (fieldConfig.validateOnChange || config.validateOnChange) {
        const formData = Object.keys(newFields).reduce((acc, key) => {
          acc[key] = newFields[key as keyof T].value;
          return acc;
        }, {} as T);
        
        const error = validateFieldValue(fieldName, value, formData);
        newFields[fieldName] = {
          ...newFields[fieldName],
          error,
          valid: !error
        };
      }
      
      const isDirty = Object.values(newFields).some(field => field.dirty);
      const isValid = Object.values(newFields).every(field => field.valid);
      
      return {
        ...prev,
        fields: newFields,
        isDirty,
        isValid
      };
    });
    
         // Auto-save functionality
     if (config.enableAutoSave && onAutoSave) {
       if (autoSaveTimer.current) {
         clearTimeout(autoSaveTimer.current);
       }
       
       autoSaveTimer.current = setTimeout(() => {
         const currentData = getFormData();
         onAutoSave(currentData);
       }, config.autoSaveDelay || 1000);
     }
  }, [config, onAutoSave, validateFieldValue]);
  
  const setFieldError = useCallback((fieldName: keyof T, error: string | null) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          error,
          valid: !error
        }
      }
    }));
  }, []);
  
  const setFieldTouched = useCallback((fieldName: keyof T, touched = true) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          touched
        }
      }
    }));
  }, []);
  
  // ================================
  // Form Operations
  // ================================
  
  const reset = useCallback(() => {
    const fields = {} as { [K in keyof T]: FormField<T[K]> };
    
    for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
      fields[fieldName as keyof T] = {
        value: fieldConfig.initialValue,
        error: null,
        touched: false,
        dirty: false,
        valid: true
      };
    }
    
    setFormState({
      fields,
      isValid: true,
      isDirty: false,
      isSubmitting: false,
      submitAttempted: false,
      submitCount: 0
    });
  }, [config.fields]);
  
  const resetField = useCallback((fieldName: keyof T) => {
    const fieldConfig = config.fields[fieldName];
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          value: fieldConfig.initialValue,
          error: null,
          touched: false,
          dirty: false,
          valid: true
        }
      }
    }));
  }, [config.fields]);
  
  // ================================
  // Submit Handling
  // ================================
  
  const handleSubmit = useCallback((onSubmitCallback: (data: T) => void | Promise<void>) => {
    return async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: true,
        submitAttempted: true
      }));
      
      try {
        // Validate form if enabled
        if (config.validateOnSubmit !== false) {
          const isValid = validateForm();
          if (!isValid) {
            setFormState(prev => ({ ...prev, isSubmitting: false }));
            return;
          }
        }
        
        const formData = getFormData();
        await onSubmitCallback(formData);
        
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          submitCount: prev.submitCount + 1
        }));
        
        // Reset form if enabled
        if (config.resetOnSubmit) {
          reset();
        }
        
      } catch (error) {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
        throw error;
      }
    };
  }, [config.validateOnSubmit, config.resetOnSubmit, validateForm, reset]);
  
  const setSubmitting = useCallback((submitting: boolean) => {
    setFormState(prev => ({ ...prev, isSubmitting: submitting }));
  }, []);
  
  // ================================
  // Additional Utility Functions
  // ================================
  
  const setFormData = useCallback((data: Partial<T>) => {
    setFormState(prev => {
      const newFields = { ...prev.fields };
      
      for (const [key, value] of Object.entries(data)) {
        if (key in newFields) {
          newFields[key as keyof T] = {
            ...newFields[key as keyof T],
            value: value as T[keyof T],
            dirty: true
          };
        }
      }
      
      const isDirty = Object.values(newFields).some(field => field.dirty);
      const isValid = Object.values(newFields).every(field => field.valid);
      
      return {
        ...prev,
        fields: newFields,
        isDirty,
        isValid
      };
    });
  }, []);
  
  const isDirty = useCallback((): boolean => {
    return formState.isDirty;
  }, [formState.isDirty]);
  
  const isValid = useCallback((): boolean => {
    return formState.isValid;
  }, [formState.isValid]);
  
  const getFieldProps = useCallback((fieldName: keyof T) => {
    const field = formState.fields[fieldName];
    const fieldConfig = config.fields[fieldName];
    
    return {
      value: field.value,
      onChange: (value: T[keyof T]) => setFieldValue(fieldName, value),
      onBlur: () => {
        setFieldTouched(fieldName, true);
        if (fieldConfig.validateOnBlur) {
          validateField(fieldName);
        }
      },
      error: field.error,
      touched: field.touched,
      dirty: field.dirty,
      valid: field.valid
    };
  }, [formState.fields, config.fields, setFieldValue, setFieldTouched, validateField]);
  
  // ================================
  // Cleanup
  // ================================
  
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);
  
  // ================================
  // Return Hook Interface
  // ================================
  
  return {
    formState,
    getFieldProps,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    reset,
    resetField,
    handleSubmit,
    setSubmitting,
    getFormData,
    setFormData,
    isDirty,
    isValid,
  };
}

export default useFormState; 