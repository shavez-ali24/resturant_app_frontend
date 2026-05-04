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

    // ── Desktop only — skip tour on mobile/tablet ──────────────────────────
    if (window.innerWidth < 1024) return;

    const allSteps = getSteps();
    const steps = buildSteps(allSteps);

    // Need at least 1 valid step
    if (steps.length === 0) {
      markTourSeen(tourKey);
      return;
    }

    const config = getDriverConfig(isDarkMode);

    // ── Keep sidebar expanded during tour ──────────────────────────────────
    const SIDEBAR_COOKIE = "sidebar_state";
    const originalCookie = document.cookie
      .split("; ")
      .find((r) => r.startsWith(`${SIDEBAR_COOKIE}=`))
      ?.split("=")[1];

    // Force cookie to expanded
    document.cookie = `${SIDEBAR_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}`;

    // Force sidebar DOM to expanded state
    // Tailwind uses data-state + data-collapsible to collapse/expand
    const sidebarEl = document.querySelector(".group.peer[data-state]");
    if (sidebarEl) {
      sidebarEl.setAttribute("data-state", "expanded");
      sidebarEl.removeAttribute("data-collapsible"); // collapsible classes tab hi apply hoti hain
    }

    // MutationObserver — agar koi aur code data-state change kare toh wapas expanded karo
    const sidebarObserver = sidebarEl ? new MutationObserver(() => {
      if (sidebarEl.getAttribute("data-state") !== "expanded") {
        sidebarEl.setAttribute("data-state", "expanded");
        sidebarEl.removeAttribute("data-collapsible");
      }
    }) : null;
    if (sidebarObserver) {
      sidebarObserver.observe(sidebarEl, { attributes: true, attributeFilter: ["data-state", "data-collapsible"] });
    }

    const restoreSidebar = () => {
      sidebarObserver?.disconnect();
      document.documentElement.classList.remove("driver-tour-active");
      // Remove injected override style
      document.getElementById("driver-tour-sidebar-fix")?.remove();
      if (originalCookie !== undefined) {
        document.cookie = `${SIDEBAR_COOKIE}=${originalCookie}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      // Restore original state
      if (sidebarEl && originalCookie === "false") {
        sidebarEl.setAttribute("data-state", "collapsed");
        sidebarEl.setAttribute("data-collapsible", "offcanvas");
      }
    };

    document.documentElement.classList.add("driver-tour-active");

    // ── driver.js built-in CSS override ───────────────────────────────────
    // driver.js injects: :not(body):has(>.driver-active-element){overflow:hidden!important}
    // Yeh sidebar ke parent container ka overflow hide kar deta hai jab
    // sidebar ke andar koi element highlight hota hai — sidebar collapse ho jaati hai.
    // Fix: driver.js ki stylesheet mein us rule ko directly disable karo.
    let disabledRule = null;
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            if (
              rule.selectorText &&
              rule.selectorText.includes("driver-active-element") &&
              rule.style?.overflow === "hidden"
            ) {
              // Rule ko delete karo — tour khatam hone par wapas add nahi karna
              // kyunki page reload hone par driver.js CSS fresh load hogi
              sheet.deleteRule(i);
              disabledRule = { sheet, index: i, text: rule.cssText };
              break;
            }
          }
        } catch { /* cross-origin sheets ignore */ }
        if (disabledRule) break;
      }
    } catch { /* ignore */ }

    const overrideStyle = document.createElement("style");
    overrideStyle.id = "driver-tour-sidebar-fix";
    overrideStyle.textContent = `
      .group\\/sidebar-wrapper:has(> .driver-active-element),
      .group\\/sidebar-wrapper { overflow: visible !important; }
      [data-sidebar="sidebar"]:has(> .driver-active-element),
      [data-sidebar="sidebar"] { overflow: visible !important; }
      .group.peer:has(> .driver-active-element) { overflow: visible !important; }
    `;
    document.head.appendChild(overrideStyle);

    driverRef.current = driver({
      ...config,
      steps,
      // ── Skip button — top-right corner mein, X button ki jagah ──────────
      onPopoverRender: (popover) => {
        try {
          // X (close) button hide karo
          if (popover.closeButton) {
            popover.closeButton.style.display = "none";
          }

          // Footer mein pehle se inject hua Skip button remove karo (re-render case)
          const existing = popover.wrapper?.querySelector(".driver-skip-btn");
          if (existing) existing.remove();

          // Popover wrapper ke top-right mein Skip button inject karo
          const wrapper = popover.wrapper;
          if (wrapper) {
            const skipBtn = document.createElement("button");
            skipBtn.className = "driver-skip-btn";
            skipBtn.innerText = "Skip";
            skipBtn.onclick = () => {
              if (driverRef.current) {
                driverRef.current.destroy();
              }
            };
            wrapper.appendChild(skipBtn);
          }
        } catch { /* ignore */ }
      },
      onHighlightStarted: (element) => {
        if (element) {
          try {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch { /* ignore */ }
        }
      },
      onDestroyed: () => {
        markTourSeen(tourKey);
        driverRef.current = null;
        restoreSidebar();
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
