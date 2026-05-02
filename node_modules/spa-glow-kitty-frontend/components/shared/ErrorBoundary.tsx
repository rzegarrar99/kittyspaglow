import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Button } from '../UI';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { KittyIcon } from '../KittyIcon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full text-center border-red-200 shadow-[0_10px_40px_-10px_rgba(220,38,38,0.15)]">
            <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-plum mb-2 uppercase tracking-tight">¡Ups! Algo salió mal</h2>
            <p className="text-plum/60 font-bold mb-6 text-sm">
              Ha ocurrido un error inesperado en la aplicación. Nuestro equipo de gatitos técnicos ya ha sido notificado.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 p-4 rounded-2xl text-left overflow-auto max-h-40 mb-6 border border-red-100">
                <p className="text-xs font-mono text-red-800">{this.state.error.toString()}</p>
              </div>
            )}

            <Button onClick={this.handleReset} className="w-full">
              <RefreshCw className="w-5 h-5" /> Recargar Aplicación
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
