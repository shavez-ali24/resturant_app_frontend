/**
 * useBackButtonClose
 *
 * Mobile back button ko intercept karta hai jab koi overlay open ho.
 *
 * Flow:
 *  - isOpen true  → pushState (fake entry) + popstate listener add
 *  - back button  → popstate fires → onClose() called (page navigate nahi hota)
 *  - isOpen false (programmatic close, e.g. X button) →
 *      replaceState se fake entry silently replace ho jati hai
 *      (history.back() nahi — wo popstate fire karta hai aur loop banta hai)
 */
import { useEffect, useRef } from "react";

export function useBackButtonClose(isOpen, onClose) {
  const didPushRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen) {
      // Fake history entry push karo
      window.history.pushState({ overlayOpen: true }, "");
      didPushRef.current = true;

      const handlePopState = (e) => {
        // Back button — overlay band karo
        didPushRef.current = false;
        onClose();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    } else {
      // Programmatic close (X button, submit, backdrop click etc.)
      // history.back() mat karo — wo popstate fire karta hai
      // Sirf fake entry ko current state se replace karo (silent, no navigation)
      if (didPushRef.current) {
        didPushRef.current = false;
        window.history.replaceState(null, "");
      }
    }
  }, [isOpen, onClose]);
}
