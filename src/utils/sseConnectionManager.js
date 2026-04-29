/**
 * Robust SSE Connection Manager with automatic reconnection
 * Implements all required reliability features:
 * - Single active connection guarantee
 * - Progressive backoff retry delays
 * - Idle connection detection
 * - Network status monitoring
 * - Stale connection recovery
 * - Automatic cleanup
 */

export class SSEConnectionManager {
  constructor(options = {}) {
    this.url = options.url;
    this.onMessage = options.onMessage || (() => {});
    this.onConnectionChange = options.onConnectionChange || (() => {});
    
    // Connection state
    this.source = null;
    this.isConnected = false;
    this.isDestroyed = false;
    
    // Retry configuration
    this.retryCount = 0;
    this.retryTimer = null;
    this.initialDelay = 3000;
    this.maxDelay = 30000;
    
    // Idle detection
    this.idleTimeout = 2 * 60 * 1000; // 2 minutes
    this.idleTimer = null;
    this.lastMessageTime = Date.now();
    
    // Network status
    this.wasOffline = false;
    
    this.bindEvents();
  }

  bindEvents() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleNetworkOnline.bind(this));
      window.addEventListener('offline', this.handleNetworkOffline.bind(this));
    }
  }

  connect() {
    if (this.isDestroyed) return;
    
    // Always close existing connection first
    this.disconnect();
    
    try {
      this.source = new EventSource(this.url);
      
      this.source.onopen = () => {
        this.isConnected = true;
        this.retryCount = 0;
        this.clearRetryTimer();
        this.resetIdleTimer();
        this.onConnectionChange(true);
      };

      this.source.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        this.resetIdleTimer();
        this.onMessage(event);
      };

      this.source.onerror = () => {
        this.handleConnectionError();
      };

    } catch (error) {
      this.handleConnectionError();
    }
  }

  disconnect() {
    this.clearRetryTimer();
    this.clearIdleTimer();
    
    if (this.source) {
      try {
        this.source.close();
      } catch (e) {
        // Ignore close errors
      }
      this.source = null;
    }
    
    if (this.isConnected) {
      this.isConnected = false;
      this.onConnectionChange(false);
    }
  }

  handleConnectionError() {
    if (this.isDestroyed) return;
    
    this.disconnect();
    
    // Don't retry if we're actively offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.wasOffline = true;
      return;
    }
    
    this.scheduleRetry();
  }

  scheduleRetry() {
    if (this.retryTimer || this.isDestroyed) return;
    
    // Progressive backoff with ceiling
    const delay = Math.min(
      this.maxDelay,
      this.initialDelay + (this.retryCount * (this.retryCount + 1) * 500)
    );
    
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.retryCount += 1;
      this.connect();
    }, delay);
  }

  handleNetworkOnline() {
    if (this.wasOffline) {
      this.wasOffline = false;
      this.retryCount = 0;
      this.clearRetryTimer();
      this.connect();
    }
  }

  handleNetworkOffline() {
    this.wasOffline = true;
    this.disconnect();
  }

  resetIdleTimer() {
    this.clearIdleTimer();
    
    if (this.isDestroyed) return;
    
    this.idleTimer = setTimeout(() => {
      // No messages received for idle period - reconnect
      if (this.isConnected && Date.now() - this.lastMessageTime >= this.idleTimeout) {
        this.connect();
      }
    }, this.idleTimeout);
  }

  clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.disconnect();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleNetworkOnline.bind(this));
      window.removeEventListener('offline', this.handleNetworkOffline.bind(this));
    }
  }

  isActive() {
    return this.isConnected && this.source && this.source.readyState === EventSource.OPEN;
  }
}

// Factory function for easy creation
export const createSSEConnection = (options) => {
  const manager = new SSEConnectionManager(options);
  manager.connect();
  return manager;
};