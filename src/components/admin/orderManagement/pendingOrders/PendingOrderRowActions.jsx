import React from "react";
import StatusDropdown from "./StatusDropdown";
import { SquarePen, Trash, Eye, Ban } from "lucide-react";

const PendingOrderRowActions = ({
  order,
  setEditingOrder,
  setShowConfirmDelete,
  updateOrder,
  onCustomizationsClick,
}) => {
  const hasCustomizations =
    order.items &&
    order.items.some(
      (item) => item.customizations && item.customizations.trim() !== ""
    );

  const customizationCount = order.items
    ? order.items.filter(
        (item) => item.customizations && item.customizations.trim() !== ""
      ).length
    : 0;

  return (
    <>
      <td className="text-center border py-2">
        {hasCustomizations ? (
          <button
            onClick={() => onCustomizationsClick?.(order)}
            className="mx-auto flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600"
            title={`${customizationCount} item(s) have customizations`}
          >
            <Eye size={14} />
            Note
            {customizationCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold ml-1">
                {customizationCount}
              </span>
            )}
          </button>
        ) : (
          <span className="text-gray-500 italic text-xs" title="No customizations">
            <Ban size={16} className="mx-auto opacity-50 text-orange-700" />
          </span>
        )}
      </td>

      <td className="border">
        <div className="flex justify-center items-center w-full">
          <StatusDropdown order={order} updateOrder={updateOrder} />
        </div>
      </td>

      <td className="text-center border py-2">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setEditingOrder?.(order)}
            className="rounded-lg p-1.5 text-orange-700 transition-colors hover:bg-orange-100"
            title="Edit order"
          >
            <SquarePen size={16} />
          </button>

          <button
            onClick={() => setShowConfirmDelete?.(order)}
            className="rounded-lg p-1.5 text-red-700 transition-colors hover:bg-red-100"
            title="Delete order"
          >
            <Trash size={16} />
          </button>
        </div>
      </td>
    </>
  );
};

export default PendingOrderRowActions;
