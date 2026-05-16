import { useState, useEffect, useRef } from "react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 350,
}) {
  const [local, setLocal] = useState(value);
  const timer = useRef(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleChange(e) {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), debounceMs);
  }

  return (
    <div className="relative inline-flex items-center">
      <svg
        className="absolute left-3 text-gray-400 pointer-events-none"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
      />
    </div>
  );
}
