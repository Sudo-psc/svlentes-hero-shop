/**
 * Blog Error Boundary
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Catches React errors in blog components and displays user-friendly fallback.
 * Prevents blog failures from breaking the entire application.
 */

'use client';

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  /**
   * Custom fallback component to render on error
   */
  fallback?: ReactNode;
  /**
   * Callback function called when an error occurs
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * BlogErrorBoundary Component
 *
 * Error boundary for blog-related components. Catches JavaScript errors
 * anywhere in the child component tree and displays a fallback UI.
 *
 * Usage:
 * ```tsx
 * <BlogErrorBoundary>
 *   <BlogSection />
 * </BlogErrorBoundary>
 * ```
 */
export class BlogErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details to console (in production, this could be sent to monitoring service)
    console.error('[BlogErrorBoundary] React component error:', error);
    console.error('[BlogErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg p-8">
          <div className="text-center max-w-md">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Conteúdo temporariamente indisponível
            </h2>
            <p className="text-gray-600 mb-6">
              Desculpe, não foi possível carregar o conteúdo do blog.
              Por favor, tente novamente mais tarde.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                Tentar Novamente
              </button>

              <Link
                href="/"
                className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Voltar para Home
              </Link>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Detalhes do erro (apenas em desenvolvimento)
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs text-red-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for easier usage
 */
export function withBlogErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithBlogErrorBoundary(props: P) {
    return (
      <BlogErrorBoundary fallback={fallback}>
        <Component {...props} />
      </BlogErrorBoundary>
    );
  };
}
