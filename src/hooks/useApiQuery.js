import { useState, useEffect, useRef, useCallback } from "react";

export function useApiQuery(fetchFn, deps = [], options = {}) {
  const { debounce: debounceMs = 0 } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  const run = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetchFn(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err);
          setLoading(false);
        }
      });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debounceMs > 0) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(run, debounceMs);
      return () => clearTimeout(timerRef.current);
    }
    run();
    return () => abortRef.current?.abort();
  }, [run, debounceMs]);

  return { data, loading, error, refetch: run };
}
