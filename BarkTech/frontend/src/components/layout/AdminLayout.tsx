import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Package, Users, FileText, Settings, Bot,
  ChevronLeft, Menu, X, LogOut, Sun, Moon, Boxes, Shield,
  Wrench, MessageSquare, Newspaper,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

interface SidebarLink {
  label: string;
  href: string;
  icon: any;
  children?: { label: string; href: string }[];
}

const sidebarLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Stock', href: '/admin/stock', icon: Boxes },
  { label: 'Leads', href: '/admin/leads', icon: Users },
  { label: 'Invoices', href: '/admin/invoices', icon: FileText },
  {
    label: 'Content',
    href: '/admin/content',
    icon: Newspaper,
    children: [
      { label: 'All Content', href: '/admin/content' },
      { label: 'Blog Posts', href: '/admin/content?type=blog' },
      { label: 'News/Press', href: '/admin/content?type=news' },
      { label: 'Case Studies', href: '/admin/content?type=case_study' },
      { label: 'Office Updates', href: '/admin/content?type=general' },
    ],
  },
  { label: 'Installations', href: '/admin/installations', icon: Wrench },
  { label: 'Users', href: '/admin/users', icon: Shield },
  { label: 'Chat Logs', href: '/admin/chat-logs', icon: MessageSquare },
  { label: 'AI Agent', href: '/admin/ai', icon: Bot },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const user = (() => { try { return JSON.parse(localStorage.getItem('bark_auth_user') || '{}'); } catch { return {}; } })();

  const handleLogout = () => {
    localStorage.removeItem('bark_auth_token');
    localStorage.removeItem('bark_auth_user');
    navigate('/admin/login');
  };

  const SidebarContent = () => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (href: string) => {
      setExpandedSections(prev => ({ ...prev, [href]: !prev[href] }));
    };

    return (
      <>
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <img src="/images/bark-logo.png" alt="Bark Technologies" className="h-8 w-auto" />
            <span className="text-sm font-bold text-foreground">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-foreground-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 px-3 py-4 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(link.href);
            const isExpanded = expandedSections[link.href] || isActive;

            if (link.children) {
              return (
                <div key={link.href}>
                  <button
                    onClick={() => toggleSection(link.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-foreground-muted hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                    {link.label}
                    {isExpanded ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
                  </button>
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {link.children.map((child) => {
                        const childActive = location.pathname === child.href.split('?')[0] && (
                          child.href.includes('?') ? location.search === '?' + child.href.split('?')[1] : true
                        ) || location.pathname + location.search === child.href;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                              childActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground-subtle hover:bg-accent hover:text-foreground'
                            )}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-foreground-muted hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-border p-3">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-muted hover:bg-accent hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back to Site
          </Link>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card lg:block">
        <div className="relative h-full"><SidebarContent /></div>
      </aside>

      {/* Sidebar — Mobile */}
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-border bg-card lg:hidden">
          <div className="relative h-full"><SidebarContent /></div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-foreground-muted hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                'text-foreground-muted hover:bg-accent hover:text-foreground'
              )}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/profile" className="hidden sm:flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="text-sm text-foreground">{user.fullName || user.email || 'Admin'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                'text-foreground-muted hover:bg-destructive/10 hover:text-destructive'
              )}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background-elevated">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
