import { MutableRefObject, useEffect, useRef } from "react";

export const usePrevious = <T>(value: T): MutableRefObject<T | undefined> => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
