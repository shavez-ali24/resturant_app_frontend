import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X, Loader2, Move, ArrowRight } from "lucide-react";
import {
  useMoveOrderMutation,
  useGetLiveOccupancyQuery,
} from "@/redux/adminRedux/adminAPI";
import { useNotification } from "../../Bell/NotificationContext";

const UNIT_STATUS_LABELS = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  BILLED: "Billed",
};

const UNIT_STATUS_COLORS = {
  AVAILABLE:
    "border-green-400 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-300",
  OCCUPIED:
    "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
  BILLED:
    "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
};

const DEFAULT_UNIT_CLASS =
  "border-gray-200 bg-white text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200";

export default function MoveTableModal({ order, onClose }) {
  const { notify } = useNotification();

  const [moveOrder, { isLoading }] = useMoveOrderMutation();

  const {
    data: liveUnitsData,
    isLoading: isUnitsLoading,
    isFetching,
    refetch,
  } = useGetLiveOccupancyQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const currentUnitId = order?.source?.unitId || null;
  const currentUnitName = order?.source?.unitName || null;
  const sourceType = order?.source?.type || "";

  const targetType = sourceType === "ROOM" ? "ROOM" : "TABLE";

  // Reset selection when modal/order/type changes
  useEffect(() => {
    setSelectedUnitId(null);
  }, [order?._id, targetType]);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, onClose]);

  // Build grouped available units once
  const { unitOptions, unitsBySection, selectedUnit } = useMemo(() => {
    const options = [];
    const grouped = {};

    if (!Array.isArray(liveUnitsData?.sections)) {
      return {
        unitOptions: options,
        unitsBySection: grouped,
        selectedUnit: null,
      };
    }

    for (const section of liveUnitsData.sections) {
      if (!Array.isArray(section?.units)) continue;

      const sectionName = section.name || "Other";

      for (const unit of section.units) {
        if (!unit) continue;

        // Same unit type only
        if (unit.type !== targetType) continue;

        // Inactive units are not selectable
        if (unit.isActive === false) continue;

        // Only available units can be moved to
        if (unit.status !== "AVAILABLE") continue;

        const unitIdentifier = unit.unitId || unit._id;

        if (!unitIdentifier) continue;

        // Exclude current unit
        if (
          currentUnitId &&
          String(unitIdentifier) === String(currentUnitId)
        ) {
          continue;
        }

        const normalizedUnit = {
          _id: String(unitIdentifier),
          name: unit.name || "Unnamed",
          type: unit.type,
          status: unit.status || "AVAILABLE",
          sectionName,
        };

        options.push(normalizedUnit);

        if (!grouped[sectionName]) {
          grouped[sectionName] = [];
        }

        grouped[sectionName].push(normalizedUnit);
      }
    }

    const selected =
      options.find(
        (unit) => String(unit._id) === String(selectedUnitId)
      ) || null;

    return {
      unitOptions: options,
      unitsBySection: grouped,
      selectedUnit: selected,
    };
  }, [
    liveUnitsData?.sections,
    targetType,
    currentUnitId,
    selectedUnitId,
  ]);

  const handleSelectUnit = useCallback(
    (unitId) => {
      if (isLoading) return;

      setSelectedUnitId(String(unitId));
    },
    [isLoading]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;

    setSelectedUnitId(null);
    onClose?.();
  }, [isLoading, onClose]);

  const handleMove = useCallback(async () => {
    if (!order?._id) {
      notify("Invalid order. Please refresh and try again.", "error");
      return;
    }

    if (!selectedUnitId || isLoading) return;

    try {
      await moveOrder({
        orderId: order._id,
        unitId: selectedUnitId,
      }).unwrap();

      notify(
        `Order moved successfully to ${selectedUnit?.name || "new unit"}!`,
        "success"
      );

      handleClose();
    } catch (err) {
      console.error("Move order failed:", err);

      const msg =
        err?.data?.message ||
        err?.message ||
        "Failed to move order. Please try again.";

      const normalizedMessage = String(msg).toLowerCase();

      if (
        normalizedMessage.includes("same") ||
        normalizedMessage.includes("already in")
      ) {
        notify("Order is already assigned to this unit.", "error");
      } else if (
        normalizedMessage.includes("occupied") ||
        normalizedMessage.includes("not available")
      ) {
        notify(
          "This unit is no longer available. Please choose another one.",
          "error"
        );

        setSelectedUnitId(null);

        // Refresh live occupancy after conflict
        refetch();
      } else {
        notify(msg, "error");
      }
    }
  }, [
    order?._id,
    selectedUnitId,
    selectedUnit?.name,
    isLoading,
    moveOrder,
    notify,
    handleClose,
    refetch,
  ]);

  const handleBackdropClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  const unitLabel = targetType === "ROOM" ? "Room" : "Table";
  const isMoveDisabled =
    !selectedUnitId ||
    isLoading ||
    !order?._id;

  return (
    <div
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-unit-modal-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              id="move-unit-modal-title"
              className="text-lg font-extrabold text-gray-800 dark:text-slate-100"
            >
              Move {unitLabel}
            </h2>

            <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
              Select an available {unitLabel.toLowerCase()} to move this order.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close move modal"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Unit */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
            Current {unitLabel}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <p className="text-base font-extrabold text-gray-800 dark:text-slate-100">
              {currentUnitName || "Unknown"}
            </p>

            {order?.source?.sectionName && (
              <span className="text-sm font-medium text-gray-400 dark:text-slate-400">
                · {order.source.sectionName}
              </span>
            )}

            {selectedUnit && (
              <>
                <ArrowRight
                  size={16}
                  className="ml-auto shrink-0 text-gray-300 dark:text-slate-500"
                />

                <span className="text-sm font-bold text-primary">
                  {selectedUnit.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Loading */}
        {isUnitsLoading || isFetching ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-8 dark:border-slate-600 dark:bg-slate-700/50">
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-primary" />

            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              Loading available {unitLabel.toLowerCase()}s...
            </p>
          </div>
        ) : unitOptions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-slate-600 dark:bg-slate-700/50">
            <Move className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-500" />

            <p className="font-bold text-gray-600 dark:text-slate-300">
              No available {unitLabel.toLowerCase()}s
            </p>

            <p className="mt-1 text-sm text-gray-400 dark:text-slate-400">
              There are currently no available {unitLabel.toLowerCase()}s
              to move this order to.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm font-bold text-gray-600 dark:text-slate-300">
              Select a new {unitLabel.toLowerCase()}:
            </p>

            <div className="mb-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {liveUnitsData?.sections?.map((section) => {
                const sectionUnits =
                  unitsBySection[section.name] || [];

                if (sectionUnits.length === 0) return null;

                return (
                  <div key={section.name}>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                      {section.name}
                    </p>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {sectionUnits.map((unit) => {
                        const isSelected =
                          String(selectedUnitId) === String(unit._id);

                        return (
                          <button
                            key={unit._id}
                            type="button"
                            onClick={() => handleSelectUnit(unit._id)}
                            disabled={isLoading}
                            aria-pressed={isSelected}
                            className={`rounded-xl border-2 p-2.5 text-center transition-all duration-150 ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary shadow-sm dark:border-primary/80 dark:bg-primary/20"
                                : `${
                                    UNIT_STATUS_COLORS[unit.status] ||
                                    DEFAULT_UNIT_CLASS
                                  } hover:border-primary/50 hover:shadow-sm`
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            <p className="text-base font-extrabold">
                              {unit.name}
                            </p>

                            <p className="text-[10px] font-semibold uppercase tracking-tight opacity-60">
                              {UNIT_STATUS_LABELS[unit.status] ||
                                unit.status}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Move Button */}
            <button
              type="button"
              onClick={handleMove}
              disabled={isMoveDisabled}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-extrabold transition-all ${
                !isMoveDisabled
                  ? "bg-primary text-white shadow-[0_8px_18px_rgba(239,159,39,0.35)] hover:bg-primary/95 active:scale-[0.99]"
                  : "cursor-not-allowed bg-gray-300 text-white dark:bg-slate-600"
              }`}
            >
              {isLoading && (
                <Loader2 size={18} className="animate-spin" />
              )}

              {isLoading
                ? "Moving..."
                : selectedUnit
                ? `Move to ${selectedUnit.name}`
                : `Select a ${unitLabel.toLowerCase()} to move`}
            </button>
          </>
        )}

        {/* Cancel */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
