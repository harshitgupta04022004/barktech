import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Package, Users, FileText, BarChart3, Settings, Bot,
  ChevronLeft, Menu, X, LogOut, Sun, Moon, Boxes, BookOpen, Shield,
  ClipboardList, Wrench, Megaphone, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Stock', href: '/admin/stock', icon: Boxes },
  { label: 'Leads', href: '/admin/leads', icon: Users },
  { label: 'Invoices', href: '/admin/invoices', icon: FileText },
  { label: 'CMS', href: '/admin/cms', icon: BookOpen },
  { label: 'Installations', href: '/admin/installations', icon: Wrench },
  { label: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
  { label: 'Users', href: '/admin/users', icon: Shield },
  { label: 'Chat Logs', href: '/admin/chat-logs', icon: MessageSquare },
  { label: 'Audit Logs', href: '/admin/audit', icon: ClipboardList },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'AI Agent', href: '/admin/ai', icon: Bot },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const user = (() => { try { return JSON.parse(localStorage.getItem('bark_auth_user') || '{}'); } catch { return {}; } })();

  const handleLogout = () => {
    localStorage.removeItem('bark_auth_token');
    localStorage.removeItem('bark_auth_user');
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <img src="/images/bark-logo.png" alt="Bark Technologies" className="h-8 w-auto" />
          <span className="text-sm font-bold text-black dark:text-white">Admin</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="space-y-1 px-3 py-4 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = link.href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-orange-500/15 text-orange-500 dark:text-orange-400 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive && 'text-orange-500 dark:text-orange-400')} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-full border-t border-gray-200 p-3 dark:border-gray-700">
        <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <ChevronLeft className="h-4 w-4" />
          Back to Site
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar — Desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-800 lg:block">
        <div className="relative h-full"><SidebarContent /></div>
      </aside>

      {/* Sidebar — Mobile */}
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:bg-gray-950 dark:border-gray-800 lg:hidden">
          <div className="relative h-full"><SidebarContent /></div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:bg-gray-950 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-black dark:text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/profile" className="hidden sm:flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-200">{user.fullName || user.email || 'Admin'}</span>
            </Link>
            <button onClick={handleLogout} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950 dark:hover:text-red-400" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
