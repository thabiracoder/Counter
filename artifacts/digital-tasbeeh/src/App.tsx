import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { loadCount, saveCount } from '@/lib/counter-storage';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [count, setCount] = useState<bigint | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const countRef = useRef<bigint | null>(null);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    void loadCount()
      .then((savedCount) => {
        if (!isMounted) return;
        countRef.current = savedCount;
        setCount(savedCount);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setStorageError(
          error instanceof Error
            ? error.message
            : 'Your saved count could not be read.',
        );
      })
      .finally(() => {
        if (isMounted) setIsInitializing(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isResetOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsResetOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isResetOpen]);

  const persistCount = (nextCount: bigint) => {
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveCount(nextCount));

    void saveQueueRef.current.catch((error: unknown) => {
      setStorageError(
        error instanceof Error
          ? error.message
          : 'Your count could not be saved locally.',
      );
    });
  };

  const handleTap = () => {
    const currentCount = countRef.current;
    if (currentCount === null || storageError) return;

    const nextCount = currentCount + 1n;
    countRef.current = nextCount;
    setCount(nextCount);
    persistCount(nextCount);
    setIsPressed(true);
    window.setTimeout(() => setIsPressed(false), 170);

    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(12);
    }
  };

  const handleReset = () => {
    if (countRef.current === null || storageError) return;

    countRef.current = 0n;
    setCount(0n);
    persistCount(0n);
    setIsResetOpen(false);
  };

  const formattedCount = count === null ? '' : formatCount(count);

  return (
    <main className="app-shell grain" aria-label="Digital Tasbeeh">
      <div className="tasbeeh-layout">
        <header className="tasbeeh-header">
          <button
            type="button"
            className="reset-button"
            onClick={() => setIsResetOpen(true)}
            aria-label="Reset count"
            title="Reset count"
            data-testid="button-reset-count"
          >
            <RotateCcw size={17} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </header>

        <section className="counter-stage" aria-label="Counter">
          {isInitializing ? (
            <div className="loading-state" role="status" aria-live="polite" data-testid="status-loading">
              <div className="loading-dial" aria-hidden="true" />
              <span className="loading-copy">Preparing your counter</span>
            </div>
          ) : (
            <>
              <output
                className={`count-display${isPressed ? ' count-pulse' : ''}`}
                aria-live="polite"
                aria-label={`Current count: ${formattedCount}`}
                data-testid="text-current-count"
              >
                {formattedCount}
              </output>
              <button
                type="button"
                className={`tap-button${isPressed ? ' tap-pressed' : ''}`}
                onClick={handleTap}
                disabled={Boolean(storageError)}
                aria-label="Tap to increment count"
                data-testid="button-tap"
              >
                <span>
                  <span className="tap-word">Tap</span>
                </span>
              </button>
            </>
          )}
        </section>
      </div>

      {storageError && (
        <div className="status-message" role="alert" data-testid="status-storage-error">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{storageError}</span>
        </div>
      )}

      {isResetOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsResetOpen(false);
          }}
        >
          <section
            className="reset-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            aria-describedby="reset-dialog-copy"
            data-testid="dialog-reset-confirmation"
          >
            <p className="dialog-eyebrow">Reset counter</p>
            <h2 id="reset-dialog-title" className="dialog-title">Begin again?</h2>
            <p id="reset-dialog-copy" className="dialog-copy">
              This will return your count to zero. Your current count will be cleared.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-button cancel"
                onClick={() => setIsResetOpen(false)}
                data-testid="button-cancel-reset"
              >
                Keep counting
              </button>
              <button
                type="button"
                className="dialog-button confirm"
                onClick={handleReset}
                data-testid="button-confirm-reset"
              >
                Reset count
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function formatCount(count: bigint): string {
  const raw = count.toString();
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
