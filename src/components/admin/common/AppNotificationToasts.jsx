import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

const MotionDiv = motion.div;

const readAdminTheme = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const root = document.documentElement;
  const body = document.body;
  const savedTheme = window.localStorage.getItem("admin-theme");

  return (
    savedTheme === "dark" ||
    root.classList.contains("admin-dark") ||
    root.classList.contains("dark") ||
    body.classList.contains("admin-dark")
  );
};

const getVariantConfig = (type, isDarkMode) => {
  const normalizedType = String(type || "").trim().toLowerCase();

  if (normalizedType === "success") {
    return {
      label: "Success",
      icon: CheckCircle2,
      shell: isDarkMode
        ? "border-emerald-500/20 bg-slate-950/95"
        : "border-emerald-200/80 bg-white/95",
      glow: "from-emerald-400/18 via-emerald-300/8 to-transparent",
      iconWrap: isDarkMode
        ? "border-emerald-500/20 bg-emerald-500/12"
        : "border-emerald-200 bg-emerald-50",
      iconColor: isDarkMode ? "text-emerald-300" : "text-emerald-600",
      pill: isDarkMode
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
        : "border-emerald-200 bg-emerald-50 text-emerald-700",
      progress: "from-emerald-400 via-emerald-300 to-lime-300",
    };
  }

  if (normalizedType === "info") {
    return {
      label: "Update",
      icon: Info,
      shell: isDarkMode
        ? "border-sky-500/20 bg-slate-950/95"
        : "border-sky-200/80 bg-white/95",
      glow: "from-sky-400/18 via-sky-300/8 to-transparent",
      iconWrap: isDarkMode
        ? "border-sky-500/20 bg-sky-500/12"
        : "border-sky-200 bg-sky-50",
      iconColor: isDarkMode ? "text-sky-300" : "text-sky-600",
      pill: isDarkMode
        ? "border-sky-500/20 bg-sky-500/10 text-sky-200"
        : "border-sky-200 bg-sky-50 text-sky-700",
      progress: "from-sky-400 via-cyan-300 to-cyan-200",
    };
  }

  return {
    label: "Alert",
    icon: AlertTriangle,
    shell: isDarkMode
      ? "border-rose-500/20 bg-slate-950/95"
      : "border-rose-200/80 bg-white/95",
    glow: "from-rose-400/18 via-rose-300/8 to-transparent",
    iconWrap: isDarkMode
      ? "border-rose-500/20 bg-rose-500/12"
      : "border-rose-200 bg-rose-50",
    iconColor: isDarkMode ? "text-rose-300" : "text-rose-600",
    pill: isDarkMode
      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
      : "border-rose-200 bg-rose-50 text-rose-700",
    progress: "from-rose-400 via-orange-300 to-amber-200",
  };
};

const NotificationItem = ({ notification, onClose, isDarkMode }) => {
  const { message, type } = notification;
  const variant = getVariantConfig(type, isDarkMode);
  const Icon = variant.icon;

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, y: -14, x: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, x: 18, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`pointer-events-auto relative overflow-hidden rounded-[1.6rem] border shadow-[0_24px_55px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl ${variant.shell}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] ${variant.glow}`}
      />

      <MotionDiv
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3, ease: "linear" }}
        className={`absolute left-0 top-0 h-1 w-full origin-left bg-gradient-to-r ${variant.progress}`}
      />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${variant.iconWrap}`}
          >
            <Icon size={20} className={variant.iconColor} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${variant.pill}`}
              >
                {variant.label}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <BellRing size={12} />
                TapnBite
              </span>
            </div>

            <p
              className={`mt-2 text-sm font-semibold leading-5 ${
                isDarkMode ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
              isDarkMode
                ? "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
            }`}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </MotionDiv>
  );
};

const AppNotificationToasts = ({ notifications, onClose }) => {
  const [isDarkMode, setIsDarkMode] = useState(readAdminTheme);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const root = document.documentElement;
    const body = document.body;
    const syncTheme = () => setIsDarkMode(readAdminTheme());

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    observer.observe(body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[9999] flex justify-end sm:inset-x-auto sm:right-5 sm:top-5">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={() => onClose(notification.id)}
              isDarkMode={isDarkMode}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppNotificationToasts;
