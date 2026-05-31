import React from "react";

// This hook keeps React state and browser localStorage in sync.
// It means the app remembers your scores after you refresh the page.
export function useLocalStorage(key, createInitialValue) {
  const [value, setValue] = React.useState(() => {
    const savedValue = window.localStorage.getItem(key);

    if (savedValue) {
      try {
        return JSON.parse(savedValue);
      } catch {
        window.localStorage.removeItem(key);
      }
    }

    return typeof createInitialValue === "function" ? createInitialValue() : createInitialValue;
  });

  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
