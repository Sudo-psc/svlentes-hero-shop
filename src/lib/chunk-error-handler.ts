// Chunk loading error handler for Next.js applications
export class ChunkLoadErrorHandler {
    private static instance: ChunkLoadErrorHandler;
    private retryCount = 0;
    private maxRetries = 3;
    private retryDelay = 1000;
    private constructor() {
        this.setupErrorHandlers();
    }
    public static getInstance(): ChunkLoadErrorHandler {
        if (!ChunkLoadErrorHandler.instance) {
            ChunkLoadErrorHandler.instance = new ChunkLoadErrorHandler();
        }
        return ChunkLoadErrorHandler.instance;
    }
    private setupErrorHandlers(): void {
        if (typeof window === 'undefined') return;
        // Handle chunk loading errors
        window.addEventListener('error', this.handleChunkError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
        // Handle navigation errors
        this.setupNavigationErrorHandler();
    }
    private handleChunkError(event: ErrorEvent): void {
        const error = event.error;
        if (this.isChunkLoadError(error) || this.isChunkLoadError(event.message)) {
            console.warn('Chunk load error detected:', error);
            this.retryChunkLoad();
            event.preventDefault();
        }
    }
    private handlePromiseRejection(event: PromiseRejectionEvent): void {
        const reason = event.reason;
        if (this.isChunkLoadError(reason)) {
            console.warn('Chunk load promise rejection:', reason);
            this.retryChunkLoad();
            event.preventDefault();
        }
    }
    private isChunkLoadError(error: any): boolean {
        if (!error) return false;
        const errorString = error.toString ? error.toString() : String(error);
        const chunkErrorPatterns = [
            'Loading chunk',
            'ChunkLoadError',
            'Loading CSS chunk',
            'Failed to import',
            'NetworkError',
            'fetch',
        ];
        return chunkErrorPatterns.some(pattern =>
            errorString.toLowerCase().includes(pattern.toLowerCase())
        );
    }
    private async retryChunkLoad(): Promise<void> {
        if (this.retryCount >= this.maxRetries) {
            console.error('Max chunk load retries exceeded, reloading page');
            this.reloadPage();
            return;
        }
        this.retryCount++;
        console.log(`Retrying chunk load (attempt ${this.retryCount}/${this.maxRetries})`);
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        // Try to reload the current route
        if (typeof window !== 'undefined' && window.location) {
            window.location.reload();
        }
    }
    private reloadPage(): void {
        if (typeof window !== 'undefined') {
            // Clear any cached chunks
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        if (name.includes('next-static') || name.includes('webpack')) {
                            caches.delete(name);
                        }
                    });
                });
            }
            // Force reload
            window.location.reload();
        }
    }
    private setupNavigationErrorHandler(): void {
        // Handle Next.js router errors
        if (typeof window !== 'undefined') {
            const originalPushState = window.history.pushState;
            const originalReplaceState = window.history.replaceState;
            window.history.pushState = function (...args) {
                try {
                    return originalPushState.apply(this, args);
                } catch (error) {
                    console.warn('Navigation error:', error);
                    ChunkLoadErrorHandler.getInstance().handleNavigationError(error);
                }
            };
            window.history.replaceState = function (...args) {
                try {
                    return originalReplaceState.apply(this, args);
                } catch (error) {
                    console.warn('Navigation error:', error);
                    ChunkLoadErrorHandler.getInstance().handleNavigationError(error);
                }
            };
        }
    }
    private handleNavigationError(error: any): void {
        if (this.isChunkLoadError(error)) {
            this.retryChunkLoad();
        }
    }
    public reset(): void {
        this.retryCount = 0;
    }
    public preloadCriticalChunks(): void {
        if (typeof window === 'undefined') return;
        // Preload critical chunks
        const criticalChunks = [
            '/_next/static/chunks/pages/_app.js',
            '/_next/static/chunks/pages/index.js',
            '/_next/static/chunks/main.js',
            '/_next/static/chunks/webpack.js',
        ];
        criticalChunks.forEach(chunk => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = chunk;
            document.head.appendChild(link);
        });
    }
}
// Initialize the error handler
export const initializeChunkErrorHandler = (): void => {
    if (typeof window !== 'undefined') {
        const handler = ChunkLoadErrorHandler.getInstance();
        handler.preloadCriticalChunks();
        // Reset retry count on successful navigation
        window.addEventListener('load', () => {
            handler.reset();
        });
    }
};
// Export for use in _app.tsx or layout.tsx