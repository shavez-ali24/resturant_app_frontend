/**
 * Robust SSE Connection Manager with automatic reconnection
 * Implements all required reliability features:
 * - Single active connection guarantee
 * - Progressive backoff retry delays
 * - Idle connection detection
 * - Network status monitoring
 * - Stale connection recovery
 * - Automatic cleanup
 * - Tab visibility recovery (laptop sleep/wake)
 * - Auth error guard (no infinite retry on 401/403)
 * - Max retry limit
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
    this.maxRetries = options.maxRetries ?? 15; // give up after 15 tries
    this.retryTimer = null;
    this.initialDelay = 3000;
    this.maxDelay = 30000;

    // Idle detection
    this.idleTimeout = 2 * 60 * 1000; // 2 minutes
    this.idleTimer = null;
    this.lastMessageTime = Date.now();

    // Network status
    this.wasOffline = false;

    // ✅ FIX: store bound references so removeEventListener works correctly
    this.boundOnline      = this.handleNetworkOnline.bind(this);
    this.boundOffline     = this.handleNetworkOffline.bind(this);
    this.boundVisibility  = this.handleVisibilityChange.bind(this);

    this.bindEvents();
  }

  bindEvents() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online',  this.boundOnline);
    window.addEventListener('offline', this.boundOffline);
    // ✅ NEW: recover after tab comes back to foreground (laptop sleep/wake)
    document.addEventListener('visibilitychange', this.boundVisibility);
  }

  connect() {
    if (this.isDestroyed) return;

    // Always close existing connection first
    this.disconnect();

    // ✅ NEW: stop retrying after max limit
    if (this.retryCount > this.maxRetries) return;

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

    // ✅ NEW: if server permanently closed (401/403/etc), readyState is CLOSED
    // and retryCount is already high — avoid hammering the server
    const permanentlyClosed =
      this.source && this.source.readyState === EventSource.CLOSED;

    this.disconnect();

    // Don't retry if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.wasOffline = true;
      return;
    }

    // Don't retry if max retries reached
    if (this.retryCount >= this.maxRetries) return;

    // For permanent server-side close, use longer initial delay
    if (permanentlyClosed && this.retryCount === 0) {
      this.retryCount = 3; // skip first few fast retries
    }

    this.scheduleRetry();
  }

  scheduleRetry() {
    if (this.retryTimer || this.isDestroyed) return;
    if (this.retryCount >= this.maxRetries) return;

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

  // ✅ NEW: reconnect when tab becomes visible again (handles laptop sleep/wake)
  handleVisibilityChange() {
    if (this.isDestroyed) return;
    if (document.visibilityState === 'visible' && !this.isActive()) {
      this.retryCount = 0;
      this.clearRetryTimer();
      this.connect();
    }
  }

  resetIdleTimer() {
    this.clearIdleTimer();
    if (this.isDestroyed) return;

    this.idleTimer = setTimeout(() => {
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
      // ✅ FIX: use stored bound references — these actually remove the right listeners
      window.removeEventListener('online',  this.boundOnline);
      window.removeEventListener('offline', this.boundOffline);
      document.removeEventListener('visibilitychange', this.boundVisibility);
    }
  }

  isActive() {
    return (
      this.isConnected &&
      this.source !== null &&
      this.source.readyState === EventSource.OPEN
    );
  }
}

// Factory function for easy creation
export const createSSEConnection = (options) => {
  const manager = new SSEConnectionManager(options);
  manager.connect();
  return manager;
};
