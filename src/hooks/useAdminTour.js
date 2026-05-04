/**
 * useAdminTour.js
 * Custom hook — handles driver.js lifecycle cleanly.
 * - Auto-starts tour on first visit (localStorage gate)
 * - Waits for DOM elements before starting (handles lazy-loaded components)
 * - Skips missing elements gracefully
 * - Cleans up on unmount
 * - Resets mobile viewport/zoom after tour ends
 */

import { useEffect, useRef, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  hasTourSeen,
  markTourSeen,
  getDriverConfig,
} from "../utils/adminTour";

// ─── Mobile viewport reset ────────────────────────────────────────────────────
// driver.js can leave behind scroll locks, body transforms, and overflow:hidden
// on mobile (especially iOS Safari). This cleans all of that up.
function resetMobileViewport() {
  const isMobile = window.innerWidth < 1024;
  if (!isMobile) return;

  // 1. Remove any overflow/position locks driver.js puts on body/html
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("position");
  document.body.style.removeProperty("top");
  document.body.style.removeProperty("left");
  document.body.style.removeProperty("width");
  document.body.style.removeProperty("transform");
  document.body.style.removeProperty("zoom");
  document.documentElement.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("transform");
  document.documentElement.style.removeProperty("zoom");

  // 2. Remove any leftover driver.js overlay/highlight elements
  document
    .querySelectorAll(".driver-overlay, .driver-popover, [class*='driver-']")
    .forEach((el) => {
      try { el.remove(); } catch { /* ignore */ }
    });

  // 3. iOS Safari zoom fix — briefly toggle user-scalable to force reset
  const viewport = document.querySelector("meta[name='viewport']");
  if (viewport) {
    const original = viewport.getAttribute("content");
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    );
    // Restore after a tick so the browser re-evaluates layout
    requestAnimationFrame(() => {
      viewport.setAttribute("content", original);
    });
  }

  // 4. Force reflow — triggers browser to recalculate layout at correct scale
  void document.documentElement.offsetHeight;

  // 5. Scroll back to top-left (prevents iOS from staying at a zoomed offset)
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });

  // 6. Fire a resize event so any layout listeners (sidebars, panels) recalculate
  window.dispatchEvent(new Event("resize"));
}

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
        // Reset mobile viewport after tour — driver.js leaves scroll locks
        // and overflow:hidden on body which breaks layout on iOS/Android
        resetMobileViewport();
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
        // Also reset on unmount in case tour was mid-flight
        resetMobileViewport();
      }
    };
  }, [tourKey, startTour, delay]);
}
