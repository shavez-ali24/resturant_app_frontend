// Shared event bus for KDS/BillPage synchronization
// This allows different tabs/windows to stay in sync without backend changes

const ITEM_READY_CHANNEL = 'kds-bill-item-ready-sync';
const ORDER_STATUS_CHANNEL = 'kds-bill-order-status-sync';
const ORDER_UPDATE_CHANNEL = 'kds-bill-order-update-sync';

// Persistent channel instances
let itemReadyChannel = null;
let orderStatusChannel = null;
let orderUpdateChannel = null;

const getItemReadyChannel = () => {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!itemReadyChannel) {
    try {
      itemReadyChannel = new BroadcastChannel(ITEM_READY_CHANNEL);
    } catch (e) {
      console.error("Failed to create ITEM_READY_CHANNEL BroadcastChannel:", e);
    }
  }
  return itemReadyChannel;
};

const getOrderStatusChannel = () => {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!orderStatusChannel) {
    try {
      orderStatusChannel = new BroadcastChannel(ORDER_STATUS_CHANNEL);
    } catch (e) {
      console.error("Failed to create ORDER_STATUS_CHANNEL BroadcastChannel:", e);
    }
  }
  return orderStatusChannel;
};

const getOrderUpdateChannel = () => {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!orderUpdateChannel) {
    try {
      orderUpdateChannel = new BroadcastChannel(ORDER_UPDATE_CHANNEL);
    } catch (e) {
      console.error("Failed to create ORDER_UPDATE_CHANNEL BroadcastChannel:", e);
    }
  }
  return orderUpdateChannel;
};

// Broadcast item ready state change
export const broadcastItemReady = (orderId, itemId, isReady) => {
  try {
    const channel = getItemReadyChannel();
    if (channel) {
      channel.postMessage({ orderId, itemId, isReady, timestamp: Date.now() });
    }
  } catch (e) {
    console.error("Error broadcasting item ready status:", e);
  }
};

// Listen for item ready state changes
export const listenForItemReady = (callback) => {
  const channel = getItemReadyChannel();
  if (!channel) return () => {};
  
  const listener = (event) => callback(event.data);
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
  };
};

// Broadcast order status change
export const broadcastOrderStatus = (orderId, status) => {
  try {
    const channel = getOrderStatusChannel();
    if (channel) {
      channel.postMessage({ orderId, status, timestamp: Date.now() });
    }
  } catch (e) {
    console.error("Error broadcasting order status:", e);
  }
};

// Listen for order status changes
export const listenForOrderStatus = (callback) => {
  const channel = getOrderStatusChannel();
  if (!channel) return () => {};
  
  const listener = (event) => callback(event.data);
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
  };
};

// Broadcast order status/item change from edit
export const broadcastOrderUpdate = (order) => {
  try {
    const channel = getOrderUpdateChannel();
    if (channel) {
      channel.postMessage({ order, timestamp: Date.now() });
    }
  } catch (e) {
    console.error("Error broadcasting order update:", e);
  }
};

// Listen for order updates
export const listenForOrderUpdate = (callback) => {
  const channel = getOrderUpdateChannel();
  if (!channel) return () => {};
  
  const listener = (event) => callback(event.data);
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
  };
};
