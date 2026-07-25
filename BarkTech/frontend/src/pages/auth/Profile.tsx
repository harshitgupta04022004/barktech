import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { STORAGE_KEYS } from '@/lib/constants';
import type { UserRole } from '@/types/user';
import {
  User, Mail, Lock, Shield, LayoutDashboard, Globe, LogOut, Save,
  Eye, EyeOff, ArrowRight, ChevronRight, Calendar, Clock,
  CheckCircle, AlertCircle, ArrowLeft, Zap, UserCircle,
} from 'lucide-react';

/* ────────────────── helpers ────────────────── */

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function resolveUserRole(storedUser: any, token: string | null): UserRole {
  if (storedUser?.role) return storedUser.role as UserRole;
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload?.role) return payload.role as UserRole;
  }
  return 'client';
}

function resolveUserName(storedUser: any): string {
  return storedUser?.name || storedUser?.fullName || 'User';
}

function resolveUserEmail(storedUser: any, token: string | null): string {
  if (storedUser?.email) return storedUser.email;
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload?.email) return payload.email;
  }
  return '';
}

/* ────────────────── role config ────────────────── */

const ROLE_META: Record<string, { label: string; color: string; icon: string }> = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: '⚡',
  },
  admin: {
    label: 'Admin',
    color: 'bg-primary/10 text-primary border-primary/20',
    icon: '🛡️',
  },
  client: {
    label: 'Client',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: '👤',
  },
  sales: {
    label: 'Sales',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: '💰',
  },
  support: {
    label: 'Support',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: '🎧',
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-muted text-muted-foreground border-border',
    icon: '👁️',
  },
};

/* ────────────────── component ────────────────── */

export function Profile() {
  const navigate = useNavigate();
  const { logout, setUser: setAuthUser } = useAuthStore();

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER) || localStorage.getItem('user');
      return JSON.parse(raw || '{}');
    } catch {
      return {};
    }
  }, []);

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  const [user, setUser] = useState(() => ({
    _id: storedUser._id || '',
    email: resolveUserEmail(storedUser, token),
    name: resolveUserName(storedUser),
    fullName: storedUser.fullName || '',
    role: resolveUserRole(storedUser, token) as string,
    isActive: storedUser.isActive !== false,
    lastLogin: storedUser.lastLogin || storedUser.lastLoginAt || '',
    createdAt: storedUser.createdAt || '',
    avatarUrl: storedUser.avatarUrl || '',
    googleId: storedUser.googleId || '',
  }));

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const isAdmin = user.role === 'super_admin' || user.role === 'admin';
  const isGoogleUser = !!user.googleId;
  const roleMeta = ROLE_META[user.role] || ROLE_META.client;
  const displayName = user.name || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const jwtScopes = useMemo(() => {
    if (!token) return [];
    const payload = decodeJwtPayload(token);
    return payload?.scopes || [];
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setSavingProfile(true);
    try {
      const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileErr(data.error || 'Update failed');
        return;
      }
      const updatedUser = { ...user, ...data.data };
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));
      setAuthUser(updatedUser as any);
      setUser((prev) => ({ ...prev, ...updatedUser }));
      setProfileMsg('Profile updated successfully');
    } catch {
      setProfileErr('Failed to connect to server');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (newPassword !== confirmPassword) {
      setPasswordErr('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordErr('New password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);
    try {
      const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordErr(data.error || 'Password change failed');
        return;
      }
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordErr('Failed to connect to server');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb bar */}
      <div className="border-b border-border bg-muted/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Site
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[13px] font-medium text-foreground">My Profile</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* PROFILE HEADER */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="h-20 w-20 rounded-2xl object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white text-2xl font-bold shadow-xl shadow-primary/20">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-3 ring-background">
                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${roleMeta.color}`}>
                    <Shield className="h-3 w-3" />
                    {roleMeta.label}
                  </span>
                  {isGoogleUser && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      <Globe className="h-2.5 w-2.5" />
                      Google
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                  {user.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {user.lastLogin && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last login {new Date(user.lastLogin).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* ADMIN DASHBOARD CTA */}
              {isAdmin && (
                <Link to="/admin" className="shrink-0">
                  <button className="group flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-left hover:bg-primary/15 hover:border-primary/40 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Admin Dashboard</p>
                      <p className="text-[11px] text-muted-foreground">Manage the platform</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-2" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN — FORMS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Profile */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Personal Information</h2>
                  <p className="text-[11px] text-muted-foreground">Update your name and email address</p>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {profileMsg && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[13px] text-emerald-400">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      {profileMsg}
                    </div>
                  )}
                  {profileErr && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13px] text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {profileErr}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Your full name"
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        className="mt-1.5 h-10"
                      />
                    </div>
                  </div>
                  {isGoogleUser && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3 w-3" />
                      Signed in via Google — your email is managed by your Google account
                    </p>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={savingProfile || isGoogleUser} className="h-10 px-5 gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 disabled:opacity-50">
                      <Save className="h-4 w-4" />
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Security / Password */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Security</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {isGoogleUser
                      ? 'Password management is handled by your Google account'
                      : 'Update your account password'}
                  </p>
                </div>
              </div>
              <div className="p-6">
                {isGoogleUser ? (
                  <div className="flex items-center gap-3 rounded-xl bg-blue-500/5 border border-blue-500/10 px-4 py-4">
                    <Globe className="h-5 w-5 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[13px] text-foreground font-medium">Google-managed account</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Your password is managed by Google. Use the Google sign-in page to change it.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {passwordMsg && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[13px] text-emerald-400">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {passwordMsg}
                      </div>
                    )}
                    {passwordErr && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13px] text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {passwordErr}
                      </div>
                    )}
                    <div>
                      <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Current Password</label>
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">New Password</label>
                        <Input
                          type={showPasswords ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          required
                          minLength={8}
                          className="mt-1.5 h-10"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Confirm Password</label>
                        <Input
                          type={showPasswords ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          required
                          minLength={8}
                          className="mt-1.5 h-10"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showPasswords ? 'Hide passwords' : 'Show passwords'}
                      </button>
                      <Button type="submit" disabled={savingPassword} className="h-10 px-5 gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20">
                        <Lock className="h-4 w-4" />
                        {savingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — SIDEBAR */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-4 w-4" />
                </div>
                <h2 className="text-[14px] font-semibold text-foreground">Quick Actions</h2>
              </div>
              <div className="p-3 space-y-1">
                {isAdmin && (
                  <Link to="/admin">
                    <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted transition-colors group">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">Admin Dashboard</p>
                        <p className="text-[11px] text-muted-foreground truncate">Manage products, leads & more</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  </Link>
                )}
                <Link to="/">
                  <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted transition-colors group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">Browse Website</p>
                      <p className="text-[11px] text-muted-foreground truncate">View products & news</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                </Link>
                <Link to="/inquiry">
                  <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted transition-colors group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">Get a Quote</p>
                      <p className="text-[11px] text-muted-foreground truncate">Request pricing</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Account Details */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <UserCircle className="h-4 w-4" />
                </div>
                <h2 className="text-[14px] font-semibold text-foreground">Account Details</h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="text-foreground font-medium">{roleMeta.label}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${user.isActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Auth Method</span>
                  <span className="text-foreground font-medium">
                    {isGoogleUser ? 'Google' : 'Email / Password'}
                  </span>
                </div>
                {user.createdAt && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">Member Since</span>
                      <span className="text-foreground font-medium">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </>
                )}
                {isAdmin && jwtScopes.length > 0 && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <span className="text-[11px] text-muted-foreground block mb-1.5">JWT Scopes</span>
                      <div className="flex flex-wrap gap-1">
                        {jwtScopes.map((scope: string) => (
                          <span key={scope} className="inline-flex items-center rounded-md bg-muted border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3.5 text-[13px] font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
