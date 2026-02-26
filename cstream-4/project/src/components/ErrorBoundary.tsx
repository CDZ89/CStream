import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Force dark background to prevent black page
    document.documentElement.style.backgroundColor = '#050508';
    document.body.style.backgroundColor = '#050508';
    document.body.style.color = '#ffffff';
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#050508',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '600px',
          }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffffff' }}>
              Oups! Une erreur s'est produite
            </h1>
            <p style={{ color: '#a0a0a8', marginBottom: '1.5rem' }}>
              L'application a rencontré un problème. Nous vous conseillons de recharger la page.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as any).style.backgroundColor = '#a78bfa';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as any).style.backgroundColor = '#8B5CF6';
              }}
            >
              Retour à l'accueil
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '2rem', color: '#a0a0a8', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Détails de l'erreur
                </summary>
                <pre style={{
                  backgroundColor: '#1a1a22',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  color: '#ffffff',
                }}>
                  {this.state.error?.toString()}
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
