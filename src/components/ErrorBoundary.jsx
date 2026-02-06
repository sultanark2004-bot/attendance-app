import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("System Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-red-50 p-4 text-center text-red-900 dark:bg-red-950 dark:text-red-100">
                    <h1 className="mb-4 text-3xl font-bold">System Error</h1>
                    <p className="mb-6 max-w-md">
                        Something went wrong. Please try resetting the application.
                    </p>
                    <pre className="mb-4 max-w-lg overflow-auto rounded bg-red-100 p-4 text-left text-xs text-red-800 dark:bg-red-900/50 dark:text-red-200">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="rounded bg-red-600 px-6 py-2 font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Reset App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
