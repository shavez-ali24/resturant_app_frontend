import React from "react";
import StatusDropdown from "./StatusDropdown";
import { MdModeEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { House, MousePointerClick, Pointer, SquarePen, Trash, Truck, Utensils } from "lucide-react";

const OrderRow = ({
  order,
  orderNum,
  setEditingOrder,
  setShowConfirmDelete,
  setOrderForBillModal,
  updateOrder,
  tableType, // 👈 receive from parent
}) => {
  return (
    <tr key={order._id} className="hover:bg-gray-50 border transition">
      {/* ✅ Time column (24-hour format) */}
      <td className="text-center border  text-gray-700">
        {order.formattedTime || "N/A "}
      </td>

      <td className="text-center border">{orderNum}</td>

      <td className="text-center border font-medium text-gray-800">
        {order.customerName}
      </td>

      <td className="text-center border text-gray-700 w-fit  text-center"> {order.customerPhone}</td>

      {/* <td className="text-center border">{order.tableId || "N/A"}</td> */}

      {/* <td className="text-center border ">{order.orderType == "Eat Here" ? `${order.orderType} : ${order.tableId}` : order.orderType}</td> */}
      <td className="flex items-center justify-center py-2.5">
        {order.orderType === "Eat Here" ? (
          <span className="inline-flex items-center justify-center h-9 w-40 px-2 rounded-lg font-semibold text-white gap-2 bg-green-600">
            <Utensils size={16} /> {order.orderType} {order.tableId ? `: ${order.tableId}` : ""}
          </span>
        ) : order.orderType === "Take Away" ? (
          <span className="inline-flex items-center justify-center h-9 w-40 px-2 rounded-lg font-semibold text-white gap-2 bg-blue-600">
            <House size={16} /> {order.orderType}
          </span>
        ) : order.orderType === "Delivery" ? (
          <span className="inline-flex items-center justify-center h-9 w-40 px-2 rounded-lg font-semibold text-white gap-2 bg-orange-500">
            <Truck size={16} /> {order.orderType}
          </span>
        ) : (
          order.orderType
        )}
      </td>


      <td className="text-center border py-2">
        <button
          onClick={() => setOrderForBillModal(order)}
          className="px-4 item-center py-2 rounded-lg  bg-gray-200  transition font-medium"
        >
          <span className="flex align-center justify-center "> View Items <Pointer size={16} className="mt-1.5" /></span>
        </button>
      </td>
      {tableType === "pending" && (
        <td className="flex justify-center align-center py-2">
          <StatusDropdown order={order} updateOrder={updateOrder} />
        </td>
      )}



      {/* 👇 Show Actions only if tableType === "pending" */}
      {tableType === "pending" && (
        <td className="text-center border">
          <button
            onClick={() => setEditingOrder(order)}
            className="px-3 py-2  text-blue-700 hover:bg-blue-100 transition font-medium"
          >
            <SquarePen size={20} />
          </button>

          <button
            onClick={() => setShowConfirmDelete(order)}
            className="px-3 py-2 text-red-700 hover:bg-red-100 transition font-medium"
          >
            <Trash size={20} />
          </button>
        </td>
      )}
    </tr>
  );
};

export default OrderRow;
