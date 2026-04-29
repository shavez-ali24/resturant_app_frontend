import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("ErrorBoundary caught an error:", error);
    if (info?.componentStack) {
      console.error(info.componentStack);
    }
  }

  render() {
    const { error, info } = this.state;
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
