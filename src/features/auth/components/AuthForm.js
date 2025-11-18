import React from "react";

const inputBaseClass = "p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2";
const inputFocusClass = "focus:ring-[#1B885E]";

export function FormInput({ name, type = "text", placeholder, value, onChange, error }) {
  const ringClass = error ? "focus:ring-red-500 ring-red-500" : inputFocusClass;
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required
      value={value}
      onChange={onChange}
      className={`${inputBaseClass} ${ringClass}`}
    />
  );
}

export function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`
        bg-[#1B885E]
        text-white
        font-semibold
        px-6 py-3
        rounded-[10px]
        shadow-md
        transition
        hover:-translate-y-1
        hover:shadow-xl
        focus:outline-none
        focus:ring-0
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

export function ErrorMessage({ error }) {
  return error ? (
    <p className="bg-red-600 text-white p-2 rounded mb-4 text-center font-semibold">
      {error}
    </p>
  ) : null;
}

