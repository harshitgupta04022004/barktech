import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  User,
  Mail,
  Lock,
  Shield,
  LayoutDashboard,
  Globe,
  LogOut,
  Save,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  fullName?: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export function Profile() {
  const navigate = useNavigate();
  const { logout, setUser: setAuthUser } = useAuthStore();
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER) || localStorage.getItem('user');
      return JSON.parse(raw || '{}');
    } catch {
      return {} as UserProfile;
    }
  });

  const [name, setName] = useState(user.name || user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setSavingProfile(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      setUser(updatedUser);
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
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    sales: 'Sales',
    support: 'Support',
    viewer: 'Viewer',
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    admin: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    support: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">My Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your account settings</p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              Back to Site
            </Button>
          </Link>
        </div>

        {/* Role Switch (Admin only) */}
        {isAdmin && (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
                <LayoutDashboard className="h-4 w-4" />
                Switch Interface
              </CardTitle>
              <CardDescription>As an admin, you can switch between client and admin views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/">
                  <button className="w-full flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-black dark:text-white">Client View</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Browse products & contact</p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-primary transition-colors" />
                  </button>
                </Link>
                <Link to="/admin">
                  <button className="w-full flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-black dark:text-white">Admin Dashboard</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Manage products & leads</p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-primary transition-colors" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
              <User className="h-4 w-4" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-black dark:text-white">{user.name || 'User'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[user.role] || ''}`}>
                <Shield className="h-3 w-3" />
                {roleLabels[user.role] || user.role}
              </span>
            </div>
            {user.lastLogin && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last login: {new Date(user.lastLogin).toLocaleString('en-IN')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
              <Mail className="h-4 w-4" />
              Edit Profile
            </CardTitle>
            <CardDescription>Update your name and email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileMsg && (
                <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-600 dark:text-green-400">{profileMsg}</div>
              )}
              {profileErr && (
                <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{profileErr}</div>
              )}
              <div>
                <label className="text-sm font-medium text-black dark:text-white">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
              <Lock className="h-4 w-4" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordMsg && (
                <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-600 dark:text-green-400">{passwordMsg}</div>
              )}
              {passwordErr && (
                <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{passwordErr}</div>
              )}
              <div>
                <label className="text-sm font-medium text-black dark:text-white">Current Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="pr-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white">New Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white">Confirm New Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPasswords ? 'Hide passwords' : 'Show passwords'}
                </button>
                <Button type="submit" disabled={savingPassword} className="gap-2">
                  <Lock className="h-4 w-4" />
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
