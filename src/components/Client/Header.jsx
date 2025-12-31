import { useState, useEffect, useRef } from "react";
import { X, Clock, MapPin, Phone, Search, UtensilsCrossed, ArrowRight } from "lucide-react";
import { FiShoppingCart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  incrementQuantity,
  clearCart,
} from "../../redux/clientRedux/clientSlice";
import { useGetRestaurantQuery, useCreateOrderMutation, useGetOrdersByFingerprintQuery } from "../../redux/clientRedux/clientAPI";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import OrderComplete from "@/components/Client/OrderComplete";
import OrderFormModal from "./OrderFormModal";
import fingerprintService from "@/service/fingerprintService";

export default function Header({
  logo,
  siteName = "Default Name",
  search,
  onSearch,
  isRestaurantOpen = true,
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const { toast } = useToast();
  const { data: restaurantData } = useGetRestaurantQuery();
  const [createOrder, { isLoading: isOrderLoading }] = useCreateOrderMutation();
  const searchRef = useRef(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableId, setTableId] = useState("");
  const [orderType, setOrderType] = useState("");
  const [address, setAddress] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.client.cart.items || {});

  const cartCount = Object.values(cartItems).reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const totalAmount = Object.values(cartItems).reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const cartEntries = Object.entries(cartItems);
  const visibleCartItems = cartEntries.slice(0, 4);
  const extraCartCount = Math.max(0, cartCount - visibleCartItems.length);

  const [fingerPrint, setFingerPrint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allOrders, setAllOrders] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  // Close search when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  // Get fingerprint on component mount
  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await fingerprintService.getFingerprint();
      setFingerPrint(fp);
    };
    getFingerprint();
  }, []);

  // Fetch orders by fingerprint with pagination
  const { data: ordersData, isLoading: ordersLoading, refetch } = useGetOrdersByFingerprintQuery(
    { fingerPrint, page: currentPage },
    { skip: !fingerPrint }
  );

  // Update orders when new data is fetched
  useEffect(() => {
    if (ordersData) {
      const orders = Array.isArray(ordersData) ? ordersData : ordersData?.orders || ordersData?.data || [];
      if (currentPage === 1) {
        setAllOrders(orders);
      } else {
        setAllOrders((prev) => [...prev, ...orders]);
      }
      // Check if there are more pages - if orders array is empty, no more pages
      // You can also check for hasMore property if API provides it
      setHasMore(orders.length > 0 && (ordersData?.hasMore !== false));
    }
  }, [ordersData, currentPage]);

  // Reset to page 1 when fingerprint changes
  useEffect(() => {
    if (fingerPrint) {
      setCurrentPage(1);
      setAllOrders([]);
      setHasMore(true);
    }
  }, [fingerPrint]);

  const handleLoadMore = () => {
    if (hasMore && !ordersLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const showSuccessMessage = (orderId) => {
    const messageDiv = document.createElement("div");
    messageDiv.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm";

    messageDiv.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200" style="animation: scale-in 0.3s ease-out;">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-gray-800 mb-2">Order Confirmed!</h3>
          <p class="text-gray-600 mb-1">Thank you for your order</p>
          <p class="text-sm text-gray-500 mb-4">Order ID: ${orderId}</p>
          
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div class="flex items-center justify-center gap-2 text-orange-700">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              <span class="text-sm font-medium">Your order is on its way.</span>
            </div>
          </div>
          
          <button class="w-full bg-orange-500 text-white py-3 rounded-xl text-base font-medium hover:bg-orange-600 transition-colors duration-200 shadow-md">
            Got It
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(messageDiv);

    const content = messageDiv.querySelector("div > div");
    content.style.transform = "scale(0.9)";
    content.style.opacity = "0";
    content.style.transition = "all 0.3s ease-out";

    setTimeout(() => {
      content.style.transform = "scale(1)";
      content.style.opacity = "1";
    }, 10);

    const closeMessage = () => {
      content.style.transform = "scale(0.9)";
      content.style.opacity = "0";
      setTimeout(() => {
        if (document.body.contains(messageDiv)) {
          document.body.removeChild(messageDiv);
        }
      }, 300);
    };

    messageDiv.querySelector("button").onclick = closeMessage;
    messageDiv.onclick = (e) => {
      if (e.target === messageDiv) closeMessage();
    };

    setTimeout(closeMessage, 5000);
  };

  const showErrorMessage = (message) => {
    const messageDiv = document.createElement("div");
    messageDiv.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm";

    messageDiv.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200" style="animation: scale-in 0.3s ease-out;">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>

          <h3 class="text-xl font-bold text-gray-800 mb-2">Order Failed</h3>
          <p class="text-gray-600 mb-4">${message}</p>
          
          <button class="w-full bg-gray-500 text-white py-3 rounded-xl text-base font-medium hover:bg-gray-600 transition-colors duration-200 shadow-md">
            Try Again
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(messageDiv);

    const content = messageDiv.querySelector("div > div");
    content.style.transform = "scale(0.9)";
    content.style.opacity = "0";
    content.style.transition = "all 0.3s ease-out";

    setTimeout(() => {
      content.style.transform = "scale(1)";
      content.style.opacity = "1";
    }, 10);

    const closeMessage = () => {
      content.style.transform = "scale(0.9)";
      content.style.opacity = "0";
      setTimeout(() => {
        if (document.body.contains(messageDiv)) {
          document.body.removeChild(messageDiv);
        }
      }, 300);
    };

    messageDiv.querySelector("button").onclick = closeMessage;
    messageDiv.onclick = (e) => {
      if (e.target === messageDiv) closeMessage();
    };

    setTimeout(closeMessage, 5000);
  };

  const isFormValid = () => {
    if (!customerName || customerName.trim().length === 0) {
      return false;
    }
    if (!customerPhone || customerPhone.length !== 10) {
      return false;
    }

    switch (orderType) {
      case "Eat Here":
        return !!tableId;
      case "Take Away":
        return true;
      case "Delivery":
        return !!address && address.trim().length > 0;
      default:
        return false;
    }
  };

  const handleOrderSubmit = async () => {
    try {
      if (!isRestaurantOpen) {
        showErrorMessage("Orders are currently closed. Please try again later.");
        return;
      }

      if (!isFormValid()) {
        let errorMessage = "Please fill all required fields correctly.";
        if (!customerName) errorMessage = "Please enter your name.";
        else if (!customerPhone || customerPhone.length !== 10)
          errorMessage = "Please enter a valid 10-digit phone number.";
        else if (orderType === "Eat Here" && !tableId)
          errorMessage = "Please select a table.";
        else if (orderType === "Delivery" && !address)
          errorMessage = "Please enter delivery address.";

        showErrorMessage(errorMessage);
        return;
      }

      const orderItems = Object.values(cartItems).map((item) => ({
        menuItemId: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        ...(item.variantKey && { variant: item.variantKey }),
        ...(item.variantLabel && { variantLabel: item.variantLabel }),
      }));

      // Get fingerprint
      const fingerPrint = await fingerprintService.getFingerprint();

      const orderData = {
        customerName: customerName.trim(),
        customerPhone,
        items: orderItems,
        totalAmount,
        orderType,
        fingerPrint,
      };

      if (orderType === "Eat Here") {
        orderData.tableId = tableId;
      }
      if (orderType === "Delivery") {
        orderData.address = address.trim();
      }

      const response = await createOrder(orderData).unwrap();
      
      showSuccessMessage(response?.orderId || response?.order?._id || `ORD${Date.now()}`);

      // Refetch orders to get the latest data from API
      if (fingerPrint) {
        setCurrentPage(1);
        setAllOrders([]);
        // Small delay to ensure order is saved on backend
        setTimeout(() => {
          refetch();
        }, 500);
      }

      setShowModal(false);
      setIsCartOpen(false);
      setOrderType("");
      setAddress("");
      setUseCurrentLocation(false);
      setCustomerName("");
      setCustomerPhone("");
      setTableId("");

      setTimeout(() => {
        dispatch(clearCart());
      }, 300);
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage = error?.data?.message || error?.message || "Failed to place order. Please try again.";
      showErrorMessage(errorMessage);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setOrderType("");
    setAddress("");
    setUseCurrentLocation(false);
    setCustomerName("");
    setCustomerPhone("");
    setTableId("");
  };

  return (
    <>
      <Toaster />
      <div className="relative z-50">
        {/* 🌟 Bottom Order Summary */}
        {totalAmount > 0 && (
          <>
            {/* Collapsed View */}
            {!isAccordionOpen && (
              <div className="fixed bottom-2 left-2 right-2 bg-gray-900/95 backdrop-blur-md rounded-3xl border-t border-gray-700 shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between p-2">
                  {/* Overlapping Images on Left */}
                  <div className="flex items-center gap-2" style={{ height: "48px" }}>
                    <div className="flex -space-x-7 pl-1">
                      {visibleCartItems.map(([id, item]) => (
                        <div
                          key={id}
                          className="relative w-12 h-12 rounded-full border border-white shadow-md bg-gray-100 overflow-hidden flex-shrink-0"
                        >
                          <img
                            src={item.image?.url || item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Quantity Badge */}
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                            {item.quantity}
                          </div>
                        </div>
                      ))}

                      {/* {extraCartCount > 0 && (
                        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary border border-white shadow-md flex-shrink-0">
                          +{extraCartCount}
                        </div>
                      )} */}
                    </div>
                    {/* Total Items Count */}
                    <div className="flex items-center gap-1 text-sm font-semibold text-white">
                      <span>{cartCount}</span>
                      <span className="text-sm text-gray-300">items</span>
                    </div>
                  </div>

                  {/* View Cart Button on Right */}
                  <button
                    onClick={() => setIsAccordionOpen(true)}
                    className="text-base flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
                  >
                    View Cart
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {/* Full Screen Accordion View */}
            {isAccordionOpen && (
              <div className="fixed inset-0 bg-white z-[100] flex flex-col">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between p-2 border-b bg-white sticky top-0 z-10">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Your Order ({cartCount})
                  </h2>
                  <button
                    onClick={() => setIsAccordionOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 pb-24">
                  {cartCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-gray-500 text-center text-lg py-6">
                        Your cart is empty 🛒
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {Object.entries(cartItems).map(([id, item]) => (
                        <li
                          key={id}
                          className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-100 hover:bg-gray-100 transition-all"
                        >
                          {/* Round Image */}
                          <img
                            src={item.image?.url || item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                          />

                          {/* Item details */}
                          <div className="flex-1 flex flex-col">
                            <p className="font-medium text-gray-800 text-[15px] leading-tight">
                              {item.name}
                            </p>
                            {item.variantLabel && (
                              <span className="text-xs text-gray-500 mt-1">
                                {item.variantLabel}
                              </span>
                            )}
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                              {/* Quantity Controls */}
                              <button
                                className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-200 text-sm font-bold transition"
                                onClick={() => dispatch(removeFromCart(id))}
                              >
                                −
                              </button>
                              <span className="w-6 text-center font-medium text-gray-700">
                                {item.quantity}
                              </span>
                              <button
                                className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-200 text-sm font-bold transition"
                                onClick={() =>
                                  dispatch(incrementQuantity(id))
                                }
                              >
                                +
                              </button>

                              <span className="ml-auto text-gray-600 font-medium">
                                ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Order Now Button - Fixed at Bottom */}
                <div className="px-6 py-4 border-t bg-white sticky bottom-0">
                  {!isRestaurantOpen ? (
                    <div className="w-full py-3 px-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-center text-sm font-semibold text-red-700">
                        Orders are currently closed
                      </p>
                    </div>
                  ) : (
                    <OrderComplete
                      amount={totalAmount.toFixed(2)}
                      buttonText="Order Now"
                      disabled={cartCount === 0}
                    onClick={() => {
                      if (!isRestaurantOpen) return;
                      setShowModal(true);
                      setIsAccordionOpen(false);
                    }}
                      className={`w-full py-3 text-base font-semibold transition-all duration-300 ${
                        cartCount === 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-primary hover:bg-primary/90 hover:shadow-lg text-white"
                      }`}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Header */}
        <header
          className="flex items-center justify-between p-3 relative"
          ref={searchRef}
        >
          <Link to="/" className="flex items-center space-x-2">
            {logo && <img src={logo} alt="Logo" className="h-12 w-auto" />}
            <span className="text-primary font-mostrate text-2xl">
              {siteName}
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            {/* Show typed search text as a small pill */}
            {(search || "").trim() && (
              <>
                {/* Restore Clear button next to query */}
                <button
                  onClick={() => onSearch("")}
                  className="flex items-center relative px-3 py-1 rounded-full border border-primary bg-primary/10 hover:bg-red-100 text-primary text-sm shadow-sm transition-colors"
                  title="Clear search"
                >
                  {search}
                  <div className="bg-red-500 w-5 h-5 absolute -top-2 -right-2 text-white rounded-full flex justify-center items-center">
                    <X className="w-4 h-4" />
                  </div>
                </button>
              </>
            )}
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`relative p-2 rounded-full transition-colors ${
                isSearchOpen
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-gray-100 text-gray-700 hover:text-black"
              }`}
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Cart Icon */}
            <button onClick={() => setIsCartOpen(true)} className="relative">
              <UtensilsCrossed className="w-6 h-6 text-gray-700 hover:text-black" />
              {allOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {allOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-50">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* Pill search input */}
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search for food items..."
                      value={search || ""}
                      onChange={(e) => onSearch(e.target.value)}
                      className="w-full rounded-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:bg-white focus:border-primary focus:shadow-md"
                      autoFocus
                    />
                  </div>

                  {/* Round action / close button */}
                  <button
                    onClick={() => {
                      onSearch("");
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 flex-shrink-0"
                    title="Close search"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Sidebar overlay with backdrop blur */}
        {isCartOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
            onClick={() => setIsCartOpen(false)}
          ></div>
        )}

        {/* Sidebar with multiple */}
        <div
          className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Your Orders</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto h-[calc(100%-80px)]">
            <div className="p-4 space-y-4">
              {ordersLoading && currentPage === 1 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : allOrders.length === 0 ? (
                <div className="text-center py-8">
                  <FiShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <>
                  {allOrders.map((order) => (
                  <div
                    key={order._id || order.id || order.orderId}
                    className="border border-orange-200 rounded-lg p-3 bg-white shadow-sm"
                  >
                    {/* Order Header with Labels */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            Name:
                          </span>
                          <p className="font-medium text-gray-800">
                            {order.customerName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 mt-3">
                            Phone:
                          </span>
                          <p className="text-sm text-gray-600 mt-3">
                            {order.customerPhone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            Type:
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              order.orderType === "Delivery"
                                ? "bg-blue-100 text-blue-700"
                                : order.orderType === "Take Away"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {order.orderType}
                          </span>
                        </div>
                        {order.tableId && (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs font-medium text-gray-500 mt-3">
                              Table:
                            </span>
                            <p className="text-xs text-gray-600 font-medium mt-3">
                              {order.tableId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery Address (if any) */}
                    {order.address && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            Address:
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {order.address}
                        </p>
                      </div>
                    )}

                    {/* Order Items with Label */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          Items:
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-700">
                              {item.name}
                              {item.variantLabel && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({item.variantLabel})
                                </span>
                              )}{" "}
                              × {item.quantity}
                            </span>
                            <span className="font-medium text-gray-800">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Total with Label */}
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-semibold text-gray-800">
                        Total Amount:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  ))}
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={ordersLoading}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {ordersLoading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Order Form Modal */}
        <OrderFormModal
          showModal={showModal}
          setShowModal={setShowModal}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          tableId={tableId}
          setTableId={setTableId}
          orderType={orderType}
          setOrderType={setOrderType}
          address={address}
          setAddress={setAddress}
          useCurrentLocation={useCurrentLocation}
          setUseCurrentLocation={setUseCurrentLocation}
          loading={isOrderLoading}
          handleOrderSubmit={handleOrderSubmit}
          restaurantData={restaurantData?.restaurant ? restaurantData : { restaurant: restaurantData }}
          logo={logo}
          resetForm={resetForm}
        />
      </div>
    </>
  );
}
