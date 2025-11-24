import { useState, useCallback } from 'react';

export function useAuthForm(initialValues) {
  const [formData, setFormData] = useState(initialValues);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        await onSubmit(formData);
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
  }, [formData]);

  const reset = useCallback(() => {
    setFormData(initialValues);
    setError("");
  }, [initialValues]);

  return {
    formData,
    error,
    loading,
    handleChange,
    handleSubmit,
    reset,
    setError,
  };
}

