"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-primary-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-sm space-y-4">
            <div className="text-4xl">🌿</div>
            <h1 className="text-lg font-semibold text-primary-900">
              Even een moment
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Er ging iets mis. Dit is waarschijnlijk tijdelijk.
              Ververs de pagina om opnieuw te proberen.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Pagina verversen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
