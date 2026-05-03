/**
 * useAdminTour.js
 * Custom hook — handles driver.js lifecycle cleanly.
 * - Auto-starts tour on first visit (localStorage gate)
 * - Waits for DOM elements before starting (handles lazy-loaded components)
 * - Skips missing elements gracefully
 * - Cleans up on unmount
 */

import { useEffect, useRef, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  hasTourSeen,
  markTourSeen,
  getDriverConfig,
} from "../utils/adminTour";

/**
 * @param {string}   tourKey   - localStorage key (from TOUR_KEYS)
 * @param {Function} getSteps  - function returning steps array
 * @param {boolean}  isDarkMode
 * @param {number}   [delay=600] - ms to wait before starting (for lazy components)
 */
export function useAdminTour(tourKey, getSteps, isDarkMode = false, delay = 600) {
  const driverRef = useRef(null);
  const timerRef  = useRef(null);

  // Filter steps — skip any whose element is not in the DOM or is hidden
  const buildSteps = useCallback((steps) =>
    steps.filter((step) => {
      if (!step.element) return true; // popover-only steps always included
      try {
        const el = document.querySelector(step.element);
        if (!el) return false;
        // Skip elements that are hidden (display:none or visibility:hidden)
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;
        // Skip elements with zero dimensions (collapsed)
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        return true;
      } catch {
        return false;
      }
    }),
  []);

  const startTour = useCallback(() => {
    if (hasTourSeen(tourKey)) return;

    const allSteps = getSteps();
    const steps = buildSteps(allSteps);

    // Need at least 1 valid step
    if (steps.length === 0) {
      markTourSeen(tourKey);
      return;
    }

    const config = getDriverConfig(isDarkMode);

    driverRef.current = driver({
      ...config,
      steps,
      onHighlightStarted: (element) => {
        // Scroll element into view before highlighting
        if (element) {
          try {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch { /* ignore */ }
        }
      },
      onDestroyed: () => {
        markTourSeen(tourKey);
        driverRef.current = null;
      },
    });

    driverRef.current.drive();
  }, [tourKey, getSteps, isDarkMode, buildSteps]);

  useEffect(() => {
    if (hasTourSeen(tourKey)) return;

    // Wait for lazy-loaded components to mount
    timerRef.current = setTimeout(startTour, delay);

    return () => {
      clearTimeout(timerRef.current);
      // Destroy driver on unmount / route change
      if (driverRef.current) {
        try { driverRef.current.destroy(); } catch { /* ignore */ }
        driverRef.current = null;
      }
    };
  }, [tourKey, startTour, delay]);
}
