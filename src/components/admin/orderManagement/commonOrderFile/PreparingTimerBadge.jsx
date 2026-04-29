import React, { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import {
  formatElapsedTimer,
  getOrderPreparingStartedAt,
  getPreparingDelayLevel,
} from "./utils";

const VARIANT_CLASSES = {
  pill: "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
  inline:
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
};

const LEVEL_CLASSES = {
  fresh:
    "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  late:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200",
  critical:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
};

const PreparingTimerBadge = ({
  order,
  variant = "pill",
  showIcon = true,
  showLabel = true,
  className = "",
}) => {
  const status = String(order?.status || "").trim().toLowerCase();
  const preparingStartedAtMs = useMemo(
    () => getOrderPreparingStartedAt(order),
    [order]
  );
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (status !== "preparing" || !preparingStartedAtMs) return undefined;

    setNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [preparingStartedAtMs, status]);

  if (status !== "preparing" || !preparingStartedAtMs) return null;

  const elapsedMs = Math.max(0, nowMs - preparingStartedAtMs);
  const delayLevel = getPreparingDelayLevel(elapsedMs);
  const timerText = `${showLabel ? "Prep " : ""}${formatElapsedTimer(elapsedMs)}`;
  const resolvedVariant = VARIANT_CLASSES[variant] ? variant : "pill";

  return (
    <span
      className={`${VARIANT_CLASSES[resolvedVariant]} ${
        LEVEL_CLASSES[delayLevel]
      } ${className}`.trim()}
    >
      {showIcon ? <Clock3 size={resolvedVariant === "inline" ? 12 : 14} /> : null}
      <span>{timerText}</span>
    </span>
  );
};

export default PreparingTimerBadge;
