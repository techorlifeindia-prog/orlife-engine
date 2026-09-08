import { useEffect } from "react";

/**
 * Custom hook to lock body scrolling when a modal or overlay is active.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [locked]);
}
