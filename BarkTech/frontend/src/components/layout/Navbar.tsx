import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogIn, User, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { STORAGE_KEYS } from '@/lib/constants';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Creasing Matrix', href: '/creasing-matrix' },
  { label: 'News', href: '/news' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userStr = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsLoggedIn(true);
          setUserName(user.name || 'User');
          setUserRole(user.role || 'viewer');
        } catch {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:border-gray-800 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/bark-logo.png" alt="Bark Technologies" className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isLoggedIn ? (
            <Link to="/profile">
              <Button variant="outline" size="sm" className="gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                {userName.split(' ')[0]}
                {isAdmin && <Shield className="h-3 w-3 text-primary" />}
              </Button>
            </Link>
          ) : (
            <Link to="/admin/login">
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Button>
            </Link>
          )}

          <Link to="/contact">
            <Button size="sm">Get a Quote</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 dark:text-gray-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isLoggedIn ? (
            <Link to="/profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </Link>
          ) : null}
          <button className="md:hidden text-gray-800 dark:text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-800 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="block text-sm font-medium text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-gray-200 dark:border-gray-800" />
          {isLoggedIn ? (
            <>
              <Link to="/profile" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  My Profile
                  {isAdmin && <Shield className="h-3 w-3 text-primary" />}
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full gap-1.5">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <Link to="/admin/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Login / Sign Up
              </Button>
            </Link>
          )}
          <Link to="/contact" onClick={() => setIsOpen(false)}>
            <Button className="w-full" size="sm">Get a Quote</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
