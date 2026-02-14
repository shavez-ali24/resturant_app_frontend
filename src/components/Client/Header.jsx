import { useState, useEffect, useRef } from "react";
import { X, Clock, MapPin, Phone, Search, UtensilsCrossed, ArrowRight } from "lucide-react";
import { FiShoppingCart } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  addToCart,
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
  onSidebarToggle
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
  const cartItems = useSelector((state) => state.client?.cart?.items || {});

  const cartCount = Object.values(cartItems || {}).reduce(
    (acc, item) => acc + (item?.quantity || 0),
    0
  );

  // ✅ बैकएंड से आए कैलकुलेशन डेटा
  const [calculatedDetails, setCalculatedDetails] = useState({
    subtotal: 0,
    gstAmount: 0,
    deliveryCharges: 0,
    totalAmount: 0,
    items: [],
    loading: false
  });

  // ✅ Individual item prices store करने के लिए
  const [itemPrices, setItemPrices] = useState({});

  const cartEntries = Object.entries(cartItems);
  const visibleCartItems = cartEntries.slice(0, 4);
  const extraCartCount = Math.max(0, cartCount - visibleCartItems.length);

  const [fingerPrint, setFingerPrint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allOrders, setAllOrders] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  // Function: Latest order से current cart के लिए estimate बनाएं
  const estimateFromLatestOrder = (latestOrder, currentCartItems) => {
    try {
      const latestOrderItems = latestOrder?.items || [];
      if (!latestOrderItems || latestOrderItems.length === 0) {
        setCalculatedDetails({
          subtotal: 0,
          gstAmount: 0,
          deliveryCharges: 0,
          totalAmount: 0,
          items: latestOrderItems,
          loading: false
        });
        setItemPrices({});
        return;
      }

      // Current cart के items की total price calculate करें
      const currentCartArray = Object.values(currentCartItems || {});
      if (!currentCartArray || currentCartArray.length === 0) {
        setCalculatedDetails({
          subtotal: 0,
          gstAmount: 0,
          deliveryCharges: 0,
          totalAmount: 0,
          items: [],
          loading: false
        });
        return;
      }

      let estimatedSubtotal = 0;
      const newItemPrices = {};

      currentCartArray.forEach(cartItem => {
        if (!cartItem) return;
        const quantity = cartItem.quantity || 1;
        const itemKey = `${cartItem.name}_${cartItem.variantLabel || ''}`;
        
        // 🔴 पहला: Exact match ढूंढें (name + variant + combo check)
        let matchingOrderItem = null;
        let itemPrice = 0;
        
        // COMBO ITEM की special handling
        if (cartItem.isCombo || cartItem.pricingType === "combo") {
          // कॉम्बो के लिए latest order में combo item ढूंढें
          matchingOrderItem = latestOrderItems.find(orderItem => {
            // कॉम्बो items की comparison
            if (orderItem.comboItems && cartItem.comboItems) {
              // Same number of combo items?
              return orderItem.name === cartItem.name;
            }
            return orderItem.name === cartItem.name;
          });
          
          if (matchingOrderItem) {
            itemPrice = matchingOrderItem.discountedPrice || matchingOrderItem.price || 0;
          } else {
            // कॉम्बो नहीं मिला तो comboPrice use करें
            itemPrice = cartItem.comboPrice || 0;
          }
        } else {
          // REGULAR/SINGLE/VARIANT ITEM
          matchingOrderItem = latestOrderItems.find(orderItem => {
            const nameMatches = orderItem.name === cartItem.name;
            
            // Variant matching
            const variantMatches = (!cartItem.variantLabel && !orderItem.variant) || 
                                  (cartItem.variantLabel && orderItem.variant && 
                                   cartItem.variantLabel.toLowerCase().includes(orderItem.variant.toLowerCase()));
            
            return nameMatches && variantMatches;
          });

          if (matchingOrderItem) {
            itemPrice = matchingOrderItem.discountedPrice || matchingOrderItem.price || 0;
          } else {
            // Exact match नहीं मिला तो same name का item ढूंढें
            const sameNameItem = latestOrderItems.find(orderItem => orderItem.name === cartItem.name);
            if (sameNameItem) {
              itemPrice = sameNameItem.discountedPrice || sameNameItem.price || 0;
            } else {
              // Latest order में भी नहीं मिला तो cart item की price use करें
              itemPrice = cartItem.price || cartItem.comboPrice || 0;
            }
          }
        }

        // Store item price for display
        newItemPrices[itemKey] = itemPrice;

        if (itemPrice > 0) {
          estimatedSubtotal += itemPrice * quantity;
        }
      });

      // Store item prices for display
      setItemPrices(newItemPrices);

      // GST calculation
      const gstRate = Number(latestOrder?.gstRate) || 0;
      const estimatedGstAmount = latestOrder?.gstEnabled ? (estimatedSubtotal * gstRate) / 100 : 0;
      
      // Delivery charges
      const deliveryCharges = orderType === "Delivery" ? (Number(latestOrder?.deliveryCharges) || 0) : 0;
      
      const estimatedTotalAmount = estimatedSubtotal + estimatedGstAmount + deliveryCharges;

      setCalculatedDetails({
        subtotal: Number(estimatedSubtotal.toFixed(2)),
        gstAmount: Number(estimatedGstAmount.toFixed(2)),
        deliveryCharges: Number(deliveryCharges.toFixed(2)),
        totalAmount: Number(estimatedTotalAmount.toFixed(2)),
        items: latestOrderItems,
        loading: false
      });

    } catch (error) {
      console.error("Estimation error:", error);
      setCalculatedDetails(prev => ({ ...prev, loading: false }));
    }
  };

  // Get item price for display - with combo support
  const getDisplayPrice = (itemName, variantLabel, isCombo = false, cartItem = null) => {
    const itemKey = `${itemName}_${variantLabel || ''}`;
    
    // First check itemPrices (from latest order estimation)
    if (itemPrices[itemKey]) {
      return Number(itemPrices[itemKey]) || 0;
    }
    
    // If not in itemPrices, check cart item's own price
    if (cartItem) {
      // Handle combo items
      if (isCombo || cartItem.pricingType === "combo") {
        return Number(cartItem.comboPrice) || 0;
      }
      // Handle variant items
      if (cartItem.variantKey && cartItem.variantRates && cartItem.variantRates[cartItem.variantKey]) {
        return Number(cartItem.variantRates[cartItem.variantKey].price) || 0;
      }
      // Handle single items
      return Number(cartItem.price) || 0;
    }
    
    return 0;
  };

  // ✅ CRITICAL FIX: Calculate price directly from cart items
  const calculateCartTotal = () => {
    if (!cartItems || Object.keys(cartItems).length === 0 || cartCount === 0) {
      return {
        subtotal: 0,
        gstAmount: 0,
        deliveryCharges: 0,
        totalAmount: 0
      };
    }

    let subtotal = 0;
    const cartItemsArray = Object.values(cartItems || {});

    cartItemsArray.forEach(cartItem => {
      if (!cartItem) return;
      const quantity = cartItem.quantity || 1;
      let itemPrice = 0;

      // Handle combo items
      if (cartItem.pricingType === "combo" || cartItem.isCombo) {
        itemPrice = Number(cartItem.comboPrice) || 0;
      }
      // Handle variant items
      else if (cartItem.variantKey && cartItem.variantRates && cartItem.variantRates[cartItem.variantKey]) {
        const variantData = cartItem.variantRates[cartItem.variantKey];
        itemPrice = Number(variantData?.price) || 0;
      }
      // Handle single items
      else {
        itemPrice = Number(cartItem.price) || 0;
      }

      subtotal += itemPrice * quantity;
    });

    // Get restaurant data for GST and delivery charges
    const restaurant = restaurantData?.restaurant || {};
    const gstRate = Number(restaurant.gstRate) || 0;
    const gstAmount = restaurant.gstEnabled ? (subtotal * gstRate) / 100 : 0;
    
    const deliveryCharges = orderType === "Delivery" ? (Number(restaurant.deliveryCharges) || 0) : 0;
    const totalAmount = subtotal + gstAmount + deliveryCharges;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      deliveryCharges: Number(deliveryCharges.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2))
    };
  };

  // ✅ Latest order से calculation details उठाएं और estimate बनाएं
  useEffect(() => {
    if (allOrders.length > 0 && cartCount > 0) {
      const latestOrder = allOrders[0];
      
      if (latestOrder.items && latestOrder.totalAmount) {
        // Latest order के items और current cart items के बीच compare करके estimate बनाएं
        estimateFromLatestOrder(latestOrder, cartItems);
      }
    } else if (cartCount > 0) {
      // If no latest order, calculate directly from cart
      const cartTotal = calculateCartTotal();
      setCalculatedDetails({
        ...cartTotal,
        items: [],
        loading: false
      });
    } else if (cartCount === 0) {
      // Cart empty है तो सब कुछ 0 कर दो
      setCalculatedDetails({
        subtotal: 0,
        gstAmount: 0,
        deliveryCharges: 0,
        totalAmount: 0,
        items: [],
        loading: false
      });
      setItemPrices({});
    }
  }, [allOrders, cartItems, cartCount, orderType, restaurantData]);

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
      // Handle different API response structures
      let orders = [];
      
      if (Array.isArray(ordersData)) {
        orders = ordersData;
      } else if (ordersData?.orders && Array.isArray(ordersData.orders)) {
        orders = ordersData.orders;
      } else if (ordersData?.data && Array.isArray(ordersData.data)) {
        orders = ordersData.data;
      } else if (ordersData?.order && typeof ordersData.order === 'object') {
        // Single order response - wrap in array
        orders = [ordersData.order];
      }
      
      if (currentPage === 1) {
        // For page 1, replace all orders (deduplicate by order ID)
        const uniqueOrders = orders.filter((order, index, self) => 
          index === self.findIndex((o) => 
            (o._id || o.id || o.orderId) === (order._id || order.id || order.orderId)
          )
        );
        setAllOrders(uniqueOrders);
      } else {
        // For subsequent pages, append new orders (deduplicate)
        setAllOrders((prev) => {
          const existingIds = new Set(prev.map(o => o._id || o.id || o.orderId));
          const newOrders = orders.filter(order => 
            !existingIds.has(order._id || order.id || order.orderId)
          );
          return [...prev, ...newOrders];
        });
      }
      // Check if there are more pages
      setHasMore(orders.length > 0 && (ordersData?.hasMore !== false));
    }
  }, [ordersData, currentPage]);

  // Pre-fill form with latest order data when modal opens
  useEffect(() => {
    if (showModal && allOrders.length > 0) {
      const latestOrder = allOrders[0];
      
      if (latestOrder.customerName) {
        setCustomerName(latestOrder.customerName);
      }
      if (latestOrder.customerPhone) {
        setCustomerPhone(latestOrder.customerPhone);
      }
      
      setOrderType("");
      setTableId("");
      setAddress("");
      setUseCurrentLocation(false);
    }
  }, [showModal]);

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
      // console.log("=== START handleOrderSubmit ===");
      
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

      // console.log("CART ITEMS FOR ORDER:", cartItems);
      
      // ✅ बैकएंड के लिए सही डेटा तैयार करें
      const orderItems = Object.values(cartItems).map((cartItem) => {
        // console.log("Creating order item for:", cartItem.name);
        
        // 🔴 CRITICAL FIX: Price calculation for all item types
        let price = 0;
        let discountedPrice = 0;
        
        if (cartItem.isCombo) {
          // Combo items
          price = cartItem.comboPrice || 0;
          discountedPrice = cartItem.comboPrice || 0;
        } else if (cartItem.variantKey && cartItem.variantRates && cartItem.variantRates[cartItem.variantKey]) {
          // Variant items
          const variantData = cartItem.variantRates[cartItem.variantKey];
          price = variantData.price || 0;
          
          // Calculate discounted price
          if (variantData.discount && variantData.discount.active) {
            if (variantData.discount.type === "percentage") {
              discountedPrice = price - (price * variantData.discount.value / 100);
            } else if (variantData.discount.type === "flat") {
              discountedPrice = price - variantData.discount.value;
            } else {
              discountedPrice = price;
            }
          } else {
            discountedPrice = price;
          }
        } else {
          // Single items
          price = cartItem.price || 0;
          
          // Calculate discounted price
          if (cartItem.discount && cartItem.discount.active) {
            if (cartItem.discount.type === "percentage") {
              discountedPrice = price - (price * cartItem.discount.value / 100);
            } else if (cartItem.discount.type === "flat") {
              discountedPrice = price - cartItem.discount.value;
            } else {
              discountedPrice = price;
            }
          } else {
            discountedPrice = price;
          }
        }

        const orderItem = {
          menuItemId: cartItem._id,
          name: cartItem.name,
          quantity: cartItem.quantity || 1,
          customizations: cartItem.customizations || "",
          // 🔴 TEMPORARY: Backend के validation के लिए price भेजें
          price: price,
          discountedPrice: discountedPrice,
          discountApplied: cartItem.discount || null
        };

        // वेरिएंट भेजें अगर है
        if (cartItem.variantKey) {
          orderItem.variant = cartItem.variantKey;
        }

        // Combo items के details भी भेजें (यदि है)
        if (cartItem.isCombo && cartItem.comboItems) {
          orderItem.comboItems = cartItem.comboItems;
        }

        // console.log("Order item with prices:", orderItem);
        return orderItem;
      });

      const fingerPrint = await fingerprintService.getFingerprint();

      // ✅ बैकएंड को डेटा भेजें (बैकएंड कैलकुलेशन करेगा)
      const orderData = {
        fingerPrint,
        customerName: customerName.trim(),
        customerPhone,
        items: orderItems,
        orderType,
      };

      // Optional fields
      if (orderType === "Eat Here" && tableId) {
        orderData.tableId = tableId;
      }
      
      if (orderType === "Delivery" && address) {
        orderData.address = address.trim();
      }

      // console.log("FINAL DATA TO BACKEND:", JSON.stringify(orderData, null, 2));

      // Send to backend
      const response = await createOrder(orderData).unwrap();
      
      showSuccessMessage(response?.orderId || response?.order?._id || `ORD${Date.now()}`);

      // Reset everything
      setCurrentPage(1);
      setAllOrders([]);
      setHasMore(true);
      
      if (fingerPrint) {
        setTimeout(() => {
          refetch();
        }, 500);
      }

      setShowModal(false);
      setIsCartOpen(false);
      onSidebarToggle?.(false);
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
      console.error("=== ORDER ERROR ===");
      console.error("Full error:", error);
      console.error("Error data:", error.data);
      console.error("Error status:", error.status);
      
      let errorMessage = error.data?.message || "Failed to place order. Please try again.";
      
      // More detailed error messages
      if (error.data?.error) {
        errorMessage += ` - ${error.data.error}`;
      }
      
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
  
  const safeOnSearch = typeof onSearch === "function" ? onSearch : () => {};

  return (
    <>
      <Toaster />
      <div className="relative z-50">
        {/* 🌟 Bottom Order Summary */}
        {cartCount > 0 && (
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
                        </div>
                      ))}
                    </div>
                    {/* Total Items Count */}
                    <div className="flex items-center gap-1 text-sm font-semibold text-white">
                      <span>{cartCount}</span>
                      <span className="text-sm text-gray-300">items</span>
                    </div>
                  </div>

                  {/* View Cart Button on Right */}
                  <button
                    onClick={() => {setIsAccordionOpen(true);onSidebarToggle?.(true);}}
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
                    onClick={() => {setIsAccordionOpen(false); onSidebarToggle?.(false);}}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pb-24">
                  {cartCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-gray-500 text-center text-lg py-6">
                        Your cart is empty 🛒
                      </p>
                    </div>
                  ) : (
                    <>
                    <ul className="space-y-4">
                      {Object.entries(cartItems || {}).map(([id, item]) => {
                        if (!item) return null;
                        const itemPrice = getDisplayPrice(item.name, item.variantLabel, item.isCombo || item.pricingType === "combo", item);
                        const itemTotal = itemPrice * (item.quantity || 1);
                        
                        return (
                          <li
                            key={id}
                            className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-100 hover:bg-gray-100 transition-all"
                          >
                            <img
                              src={item.image?.url || item.image}
                              alt={item.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                            />

                            <div className="flex-1 flex flex-col">
                              <p className="font-medium text-gray-800 text-[15px] leading-tight">
                                {item.name}
                              </p>
                              {item.variantLabel && (
                                <span className="text-xs text-gray-500 mt-1">
                                  {item.variantLabel}
                                </span>
                              )}
                              {item.isCombo && (
                                <span className="text-xs text-orange-600 font-medium mt-1">
                                  Combo
                                </span>
                              )}
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                                <button
                                  className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-200 text-sm font-bold transition"
                                  onClick={() => dispatch(removeFromCart(id))}
                                >
                                  −
                                </button>
                                <span className="w-6 text-center font-medium text-gray-700">
                                  {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2).replace('.00', '').replace('.25', '¼').replace('.50', '½').replace('.75', '¾')}
                                </span>
                                <button
                                  className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-200 text-sm font-bold transition"
                                  onClick={() => dispatch(addToCart({ id, item: item, price: getDisplayPrice(item.name, item.variantLabel, item.isCombo, item) }))}
                                >
                                  +
                                </button>

                                <span className="ml-auto text-gray-600 font-medium flex flex-col items-end">
                                  {/* ✅ Item price और total दिखाएं */}
                                  {itemPrice > 0 ? (
                                    <>
                                      <span className="text-sm">₹{itemPrice.toFixed(2)} × {item.quantity}</span>
                                      <span className="text-base font-semibold text-gray-800">
                                        = ₹{itemTotal.toFixed(2)}
                                      </span>
                                    </>
                                  ) : item.isCombo ? (
                                    <>
                                      <span className="text-sm">Combo: ₹{(item.comboPrice || 0).toFixed(2)} × {item.quantity}</span>
                                      <span className="text-base font-semibold text-gray-800">
                                        = ₹{((item.comboPrice || 0) * (item.quantity || 1)).toFixed(2)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-500">Price calculating...</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    
                    <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                      {/* Always show calculated totals */}
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium text-gray-800">
                            ₹{calculatedDetails.subtotal.toFixed(2)}
                          </span>
                        </div>
                        
                        {orderType === "Delivery" && calculatedDetails.deliveryCharges > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Delivery Charges</span>
                            <span className="font-medium text-orange-600">
                              ₹{calculatedDetails.deliveryCharges.toFixed(2)}
                            </span>
                          </div>
                        )}
                        
                        {calculatedDetails.gstAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">GST</span>
                            <span className="font-medium text-gray-800">
                              ₹{calculatedDetails.gstAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        
                        <div className="border-t pt-2 flex justify-between items-center">
                          <span className="text-base font-bold text-gray-800">Total Amount</span>
                          <span className="text-lg font-bold text-primary">
                            ₹{calculatedDetails.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500 text-center mt-2">
                          {allOrders.length > 0 ? "Amount estimated from previous order" : "Amount calculated from cart items"}
                        </p>
                      </>
                    </div>
                    </>
                  )}
                </div>

                <div className="px-6 py-4 border-t bg-white sticky bottom-0">
                  {!isRestaurantOpen ? (
                    <div className="w-full py-3 px-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-center text-sm font-semibold text-red-700">
                        Orders are currently closed
                      </p>
                    </div>
                  ) : (
                    <OrderComplete
                      buttonText="Order Now"
                      disabled={cartCount === 0}
                      onClick={() => {
                        if (!isRestaurantOpen) return;
                        setOrderType("");
                        setTableId("");
                        setAddress("");
                        setUseCurrentLocation(false);
                        setShowModal(true);
                        setIsAccordionOpen(false);
                        onSidebarToggle?.(false);
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
            <button onClick={() => {setIsCartOpen(true);onSidebarToggle?.(true);}} className="relative">
              <UtensilsCrossed className="w-6 h-6 text-gray-700 hover:text-black" />
              {allOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
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
                      onChange={(e) => safeOnSearch(e.target.value)}
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
            onClick={() => {  setIsCartOpen(false);onSidebarToggle?.(false);}}
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
              onClick={() => {setIsCartOpen(false);onSidebarToggle?.(false)}}
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
                  {allOrders.slice(0, 1).map((order) => (
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
                        {order.status && (
                          <div className="flex items-center gap-1 justify-end mb-1">
                            <span className="text-xs font-medium text-gray-500">
                              Status:
                            </span>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : order.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        )}
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
                              {item.variant && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({item.variant})
                                </span>
                              )}{" "}
                              × {item.quantity}
                            </span>
                            <span className="font-medium text-gray-800">
                              ₹{Number(item.discountedPrice || item.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GST (if enabled) */}
                    {order.gstAmount !== undefined && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">
                          GST {order.gstRate ? `(${order.gstRate}%)` : ""}:
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          ₹{Number(order.gstAmount).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Delivery Charges (if delivery order) */}
                    {order.orderType === "Delivery" && typeof order.deliveryCharges === "number" && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">
                          Delivery Charges:
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          ₹{Number(order.deliveryCharges).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="border-t pt-2 flex justify-between items-center mt-2">
                      <span className="font-semibold text-gray-800">
                        Total Amount:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        ₹{order.totalAmount?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                  ))}
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
          cartItems={cartItems}
          logo={logo}
          resetForm={resetForm}
          calculatedDetails={calculatedDetails}
        />
      </div>
    </>
  );
}