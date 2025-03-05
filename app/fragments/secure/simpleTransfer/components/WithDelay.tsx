import { useState, useEffect, ReactNode } from "react";

interface WithDelayProps {
  delay?: number;
  children: ReactNode;
}

export const WithDelay = ({ delay = 0, children }: WithDelayProps) => {
  const [isVisible, setIsVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) {
        return
    }
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) return null;

  return children;
};
