import { useSelector, useDispatch } from "react-redux";
import BillPage from "./BillPage";
import { hideBill } from "@/redux/adminRedux/billSlice";

export default function BillModal({ 
  menuItems = [], 
  tables = [],
  updateOrder 
}) {
  const dispatch = useDispatch();

  const { open, selectedOrder, restaurantDetails } = useSelector(
    (state) => state.bill
  );

  if (!open || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <BillPage
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
