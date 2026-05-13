import { useEffect, useState } from "react";

interface UseDebounced {
  searchQuery: string;
  delay: number;
}

export function useDebounced({ searchQuery, delay }: UseDebounced) {
  const [debouncedValue, setDebouncedValue] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchQuery);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, delay]);

  return debouncedValue;
}
