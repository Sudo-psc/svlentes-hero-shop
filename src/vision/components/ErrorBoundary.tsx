'use client'

import { Component, type ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined })
        if (typeof window !== 'undefined') {
            window.location.reload()
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                    <Card className="max-w-md">
                        <CardHeader>
                            <h2 className="text-xl font-bold text-red-600">Algo deu errado</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Ocorreu um erro inesperado no questionário. Por favor, tente novamente.
                            </p>
                            {this.state.error && process.env.NODE_ENV === 'development' && (
                                <pre className="rounded bg-slate-100 p-2 text-xs text-red-600">
                                    {this.state.error.message}
                                </pre>
                            )}
                            <Button onClick={this.handleReset} className="w-full">
                                Recarregar Questionário
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}
