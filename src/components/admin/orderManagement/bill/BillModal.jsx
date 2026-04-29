import { useSelector, useDispatch } from "react-redux";
import BillPage from "./BillPage";
import { hideBill } from "@/redux/adminRedux/billSlice";
import { useNotification } from "../../Bell/NotificationContext";

export default function BillModal({
  menuItems = [],
  tables = [],
  updateOrder
}) {
  const dispatch = useDispatch();
  const { sseEvent } = useNotification();

  const { open, selectedOrder, restaurantDetails } = useSelector(
    (state) => state.bill
  );

  if (!open || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <BillPage
        sseEvent={sseEvent}
        order={selectedOrder}
        restaurantDetails={restaurantDetails}
        onClose={() => dispatch(hideBill())}
        menuItems={menuItems}
        tables={tables}
        updateOrder={updateOrder}
      />
    </div>
  );
}
