import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Catches render errors so a single failure never leaves a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('Unexpected rendering error', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div>
          <h1 className="display" style={{ fontSize: 40 }}>
            Something went wrong.
          </h1>
          <p style={{ margin: '12px 0 24px', color: 'var(--ink-soft)' }}>Please try again.</p>
          <button type="button" className="button button-primary" onClick={this.reset}>
            Try again
          </button>
        </div>
      </div>
    );
  }
}
