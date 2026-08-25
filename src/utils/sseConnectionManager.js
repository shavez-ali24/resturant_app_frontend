export class SSEConnectionManager {
  constructor(options = {}) {
    this.url = options.url;
    this.onMessage = options.onMessage || (() => {});
    this.onConnectionChange = options.onConnectionChange || (() => {});

    this.source = null;
    this.isConnected = false;
    this.isDestroyed = false;

    this.retryCount = 0;
    this.maxRetries = options.maxRetries ?? 15;
    this.retryTimer = null;

    this.initialDelay = options.initialDelay ?? 3000;
    this.maxDelay = options.maxDelay ?? 30000;

    this.wasOffline = false;

    this.boundOnline = this.handleNetworkOnline.bind(this);
    this.boundOffline = this.handleNetworkOffline.bind(this);
    this.boundVisibility = this.handleVisibilityChange.bind(this);

    this.bindEvents();
  }

  bindEvents() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", this.boundOnline);
    window.addEventListener("offline", this.boundOffline);
    document.addEventListener("visibilitychange", this.boundVisibility);
  }

  connect() {
    if (this.isDestroyed) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.wasOffline = true;
      return;
    }

    if (this.isActive()) return;

    if (this.retryCount >= this.maxRetries) return;

    this.closeConnection();

    try {
      this.source = new EventSource(this.url);

      this.source.onopen = () => {
        if (this.isDestroyed) return;

        this.isConnected = true;
        this.retryCount = 0;
        this.clearRetryTimer();

        this.onConnectionChange(true);
      };

      this.source.onmessage = (event) => {
        if (this.isDestroyed) return;

        this.onMessage(event);
      };

      this.source.onerror = () => {
        this.handleConnectionError();
      };
    } catch (_) {
      this.handleConnectionError();
    }
  }

  closeConnection() {
    if (this.source) {
      try {
        this.source.close();
      } catch (_) {
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

    this.closeConnection();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.wasOffline = true;
      return;
    }

    if (this.retryCount >= this.maxRetries) return;

    this.scheduleRetry();
  }

  scheduleRetry() {
    if (this.retryTimer || this.isDestroyed) return;
    if (this.retryCount >= this.maxRetries) return;

    const delay = Math.min(
      this.maxDelay,
      this.initialDelay + this.retryCount * (this.retryCount + 1) * 500
    );

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;

      if (this.isDestroyed) return;

      this.retryCount += 1;
      this.connect();
    }, delay);
  }

  handleNetworkOnline() {
    this.wasOffline = false;
    this.retryCount = 0;
    this.clearRetryTimer();

    if (!this.isActive()) {
      this.connect();
    }
  }

  handleNetworkOffline() {
    this.wasOffline = true;
    this.clearRetryTimer();
    this.closeConnection();
  }

  handleVisibilityChange() {
    if (this.isDestroyed) return;

    if (document.visibilityState === "visible" && !this.isActive()) {
      this.retryCount = 0;
      this.clearRetryTimer();
      this.connect();
    }
  }

  clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.clearRetryTimer();
    this.closeConnection();

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.boundOnline);
      window.removeEventListener("offline", this.boundOffline);
      document.removeEventListener("visibilitychange", this.boundVisibility);
    }
  }

  isActive() {
    return Boolean(
      this.isConnected &&
        this.source &&
        this.source.readyState === EventSource.OPEN
    );
  }
}

export const createSSEConnection = (options) => {
  const manager = new SSEConnectionManager(options);
  manager.connect();
  return manager;
};
