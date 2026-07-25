import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogIn, User, Shield, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { STORAGE_KEYS } from '@/lib/constants';
import { cn } from '@/lib/utils';

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
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isDark = resolvedTheme === 'dark';

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        'border-b',
        scrolled
          ? 'bg-background/80 shadow-md backdrop-blur-xl border-border'
          : 'bg-background/60 backdrop-blur-md border-transparent'
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/images/bark-logo.png" alt="Bark Technologies" className="h-8 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'relative px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground-muted hover:text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
              'text-foreground-muted hover:bg-accent hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link to="/chat">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-[13px] text-foreground-muted">
              <MessageCircle className="h-3.5 w-3.5" />
              AI Chat
            </Button>
          </Link>

          {isLoggedIn ? (
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-[13px]">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                {userName.split(' ')[0]}
                {isAdmin && <Shield className="h-3 w-3 text-primary" />}
              </Button>
            </Link>
          ) : (
            <Link to="/admin/login">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-[13px] text-foreground-muted">
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Button>
            </Link>
          )}

          <div className="w-px h-5 bg-border mx-1" />

          <Link to="/inquiry">
            <Button size="sm" className="h-8 px-4 text-[13px] font-semibold bg-primary hover:bg-primary/90 shadow-sm shadow-primary/25">
              Get a Quote
            </Button>
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              'text-foreground-muted hover:bg-accent hover:text-foreground'
            )}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isLoggedIn ? (
            <Link to="/profile" className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {userName.charAt(0).toUpperCase()}
            </Link>
          ) : null}
          <button
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              'text-foreground hover:bg-accent'
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground-muted hover:text-foreground hover:bg-accent'
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-border my-2" />
          {isLoggedIn ? (
            <>
              <Link to="/profile" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-2 h-10 text-[13px]">
                  <User className="h-4 w-4" />
                  My Profile
                  {isAdmin && <Shield className="h-3 w-3 text-primary ml-auto" />}
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2 h-10 text-[13px]">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <Link to="/admin/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-start gap-2 h-10 text-[13px]">
                <LogIn className="h-4 w-4" />
                Login / Sign Up
              </Button>
            </Link>
          )}
          <Link to="/chat" onClick={() => setIsOpen(false)}>
            <Button variant="outline" className="w-full justify-start gap-2 h-10 text-[13px]">
              <MessageCircle className="h-4 w-4" />
              AI Chat
            </Button>
          </Link>
          <Link to="/inquiry" onClick={() => setIsOpen(false)}>
            <Button className="w-full h-10 text-[13px] font-semibold">Get a Quote</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
