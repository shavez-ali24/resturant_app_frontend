import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, isReloading: false };
  }

  static getDerivedStateFromError(error) {
    const isChunkError =
      error &&
      (error.name === "ChunkLoadError" ||
       /failed to fetch dynamically imported module/i.test(error.message || "") ||
       /loading chunk/i.test(error.message || ""));

    if (isChunkError) {
      return { error: null, info: null, isReloading: true };
    }
    return { error, info: null, isReloading: false };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("ErrorBoundary caught an error:", error);

    const isChunkError =
      error &&
      (error.name === "ChunkLoadError" ||
       /failed to fetch dynamically imported module/i.test(error.message || "") ||
       /loading chunk/i.test(error.message || ""));

    if (isChunkError) {
      console.warn("Dynamic import module fetch failed. Reloading the page to load new bundle version...");
      window.location.reload();
      return;
    }

    if (info?.componentStack) {
      console.error(info.componentStack);
    }
  }

  render() {
    const { error, info, isReloading } = this.state;

    if (isReloading) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
            <span className="text-sm font-semibold tracking-wide">Updating TapnBite to latest version...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-300 mb-4">
              {error.message || "Unknown error"}
            </p>
            {info?.componentStack && (
              <pre className="whitespace-pre-wrap text-xs text-slate-300/90 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {info.componentStack}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
