'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('[DataCouncil] Component error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-4">💥</div>
              <h2 className="text-[#e9edef] text-lg font-medium mb-2">
                Something broke
              </h2>
              <p className="text-[#8696a0] text-sm mb-6">
                The council had a technical disagreement. Try again?
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="bg-[#00a884] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#00c49a] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
