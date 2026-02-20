"use client";

import { useState, useEffect } from "react";

export function usePreloader(duration: number = 2500) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("preloaderShown")) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("preloaderShown", "true");
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return isLoading;
}
