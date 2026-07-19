import { Link } from 'react-router-dom';
import { Home, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <span className="text-7xl font-black text-gray-200 dark:text-gray-700">404</span>
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg">
          <span className="text-lg font-bold">?</span>
        </div>
      </div>

      {/* Message */}
      <h1 className="text-4xl font-bold text-black dark:text-white">Page Not Found</h1>
      <p className="mt-4 max-w-md text-gray-600 dark:text-gray-400">
        The page you are looking for does not exist or has been moved. Let us get you back on track.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/">
          <Button size="lg" className="gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
        <Link to="/products">
          <Button variant="outline" size="lg" className="gap-2 dark:border-gray-600 dark:text-gray-200">
            <Package className="h-4 w-4" />
            Browse Products
          </Button>
        </Link>
      </div>

      {/* Back Link */}
      <button
        onClick={() => window.history.back()}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back
      </button>
    </div>
  );
}
