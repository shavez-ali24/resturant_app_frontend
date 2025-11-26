import { useSelector, useDispatch } from "react-redux";
import BillPage from "./BillPage";
import { hideBill } from "@/redux/adminRedux/billSlice";

export default function BillModal() {
  const dispatch = useDispatch();
  const { open, selectedOrder, restaurantDetails } = useSelector(
    (state) => state.bill
  );

  if (!open || !selectedOrder) return null;

  return (
    <BillPage
      order={selectedOrder}
      restaurantDetails={restaurantDetails}
      onClose={() => dispatch(hideBill())}
    />
  );
}
