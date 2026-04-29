// Shared event bus for KDS/BillPage synchronization
// This allows different tabs/windows to stay in sync without backend changes

const ITEM_READY_CHANNEL = 'kds-bill-item-ready-sync';
const ORDER_UPDATE_CHANNEL = 'kds-bill-order-update-sync';

// Broadcast item ready state change
export const broadcastItemReady = (orderId, itemId, isReady) => {
  try {
    const channel = new BroadcastChannel(ITEM_READY_CHANNEL);
    channel.postMessage({ orderId, itemId, isReady, timestamp: Date.now() });
    channel.close();
  } catch (e) {
    // Ignore
  }
};

// Listen for item ready state changes
export const listenForItemReady = (callback) => {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(ITEM_READY_CHANNEL);
  channel.onmessage = (event) => callback(event.data);
  return () => channel.close();
};

// Broadcast order status/item change from edit
export const broadcastOrderUpdate = (order) => {
  try {
    const channel = new BroadcastChannel(ORDER_UPDATE_CHANNEL);
    channel.postMessage({ order, timestamp: Date.now() });
    channel.close();
  } catch (e) {
    // Ignore
  }
};

// Listen for order updates
export const listenForOrderUpdate = (callback) => {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(ORDER_UPDATE_CHANNEL);
  channel.onmessage = (event) => callback(event.data);
  return () => channel.close();
};
