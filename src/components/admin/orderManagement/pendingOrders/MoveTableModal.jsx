import React, { useState, useMemo } from "react";
import { X, Loader2, Move, ArrowRight } from "lucide-react";
import { useMoveOrderMutation, useGetLiveUnitsQuery } from "@/redux/adminRedux/adminAPI";
import { useNotification } from "../../Bell/NotificationContext";

const UNIT_STATUS_LABELS = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  BILLED: "Billed",
};

const UNIT_STATUS_COLORS = {
  AVAILABLE: "border-green-400 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-300",
  OCCUPIED: "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
  BILLED: "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function MoveTableModal({ order, onClose }) {
  const { notify } = useNotification();

  const [moveOrder, { isLoading }] = useMoveOrderMutation();
  const { data: liveUnitsData } = useGetLiveUnitsQuery();

  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const currentUnitId = order?.source?.unitId || null;
  const currentUnitName = order?.source?.unitName || null;
  const sourceType = order?.source?.type || "";

  // Determine unit type filter: TABLE or ROOM
  const targetType = sourceType === "ROOM" ? "ROOM" : "TABLE";

  // Build available units list from live units data
  const unitOptions = useMemo(() => {
    if (!liveUnitsData?.sections) return [];

    const options = [];
    for (const section of liveUnitsData.sections) {
      if (!Array.isArray(section.units)) continue;
      for (const unit of section.units) {
        // Filter by same type
        if (unit.type !== targetType) continue;
        // Hide inactive units
        if (unit.isActive === false) continue;
        // Filter out occupied/billed
        if (unit.status === "OCCUPIED" || unit.status === "BILLED") continue;
        // 🔧 FIX: Backend liveUnits returns unitId (not _id)
        const unitIdentifier = unit.unitId || unit._id;
        // Filter out current unit
        if (unitIdentifier && currentUnitId && String(unitIdentifier) === String(currentUnitId)) continue;

        options.push({
          _id: unitIdentifier,
          name: unit.name,
          type: unit.type,
          status: unit.status,
          sectionName: section.name,
        });
      }
    }

    return options;
  }, [liveUnitsData, targetType, currentUnitId]);

  const handleMove = async () => {
    if (!selectedUnitId) return;

    try {
      await moveOrder({
        orderId: order._id,
        unitId: selectedUnitId,
      }).unwrap();
      notify("Order moved successfully!", "success");
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to move order";
      if (msg.toLowerCase().includes("same") || msg.toLowerCase().includes("already")) {
        notify("Order is already in this unit.", "error");
      } else if (msg.toLowerCase().includes("occupied")) {
        notify("Target unit is already occupied.", "error");
      } else {
        notify(msg, "error");
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 cursor-default"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">
            Move {targetType === "ROOM" ? "Room" : "Table"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current unit info */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
            Current {targetType === "ROOM" ? "Room" : "Table"}
          </p>
          <p className="mt-0.5 text-base font-extrabold text-gray-800 dark:text-slate-100">
            {currentUnitName || "Unknown"}
            {order?.source?.sectionName && (
              <span className="ml-1.5 text-sm font-medium text-gray-400 dark:text-slate-400">
                · {order.source.sectionName}
              </span>
            )}
          </p>
        </div>

        {/* Available units grid */}
        {unitOptions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-slate-600 dark:bg-slate-700/50">
            <Move className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-500" />
            <p className="font-bold text-gray-600 dark:text-slate-300">No available units</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-slate-400">
              All {targetType === "ROOM" ? "rooms" : "tables"} of this type are currently occupied.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm font-bold text-gray-600 dark:text-slate-300">
              Select a new {targetType === "ROOM" ? "room" : "table"}:
            </p>
            <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
              {liveUnitsData?.sections?.map((section, si) => {
                const sectionUnits = unitOptions.filter(
                  (u) => u.sectionName === section.name
                );
                if (sectionUnits.length === 0) return null;

                return (
                  <div key={si}>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                      {section.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {sectionUnits.map((unit) => {
                        const isSelected = selectedUnitId === unit._id;
                        return (
                          <button
                            key={unit._id}
                            type="button"
                            onClick={() => setSelectedUnitId(unit._id)}
                            className={`rounded-xl border-2 p-2.5 text-center transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-900/30"
                                : `${UNIT_STATUS_COLORS[unit.status] || "border-gray-200 bg-white dark:border-slate-600 dark:bg-slate-700"} hover:border-orange-300`
                            }`}
                          >
                            <p className="text-base font-extrabold">{unit.name}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-tight opacity-60">
                              {UNIT_STATUS_LABELS[unit.status] || unit.status}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Move button */}
            <button
              onClick={handleMove}
              disabled={!selectedUnitId || isLoading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-extrabold text-white transition-all ${
                selectedUnitId && !isLoading
                  ? "bg-orange-500 shadow-[0_8px_18px_rgba(249,115,22,0.3)] hover:bg-orange-600"
                  : "cursor-not-allowed bg-gray-300 dark:bg-slate-600"
              }`}
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading
                ? "Moving..."
                : selectedUnitId
                ? `Move to ${unitOptions.find((u) => u._id === selectedUnitId)?.name || "Selected"}`
                : "Select a unit to move"}
            </button>
          </>
        )}

        {/* Cancel */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
