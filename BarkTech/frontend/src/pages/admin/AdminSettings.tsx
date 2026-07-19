import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/lib/theme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings, Moon, Sun, User, Shield, Save, Building2, Globe,
  Lock, AlertTriangle, CheckCircle, Eye, EyeOff, Key, Mail, Phone,
  Bot, Plus, Trash2, Star, Power, PowerOff, Loader2,
} from 'lucide-react';

interface AIModel {
  _id: string;
  name: string;
  modelId: string;
  provider: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  role: 'client' | 'admin';
  maxTokens: number;
  temperature: number;
  createdAt: string;
}

export function AdminSettings() {
  const { theme, toggleTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Company fields
  const [companyName, setCompanyName] = useState('Bark Technologies');
  const [companyEmail, setCompanyEmail] = useState('info@barktechnologies.in');
  const [companyPhone, setCompanyPhone] = useState('+91 8810597980');
  const [companyAddress, setCompanyAddress] = useState('SF-03, Shushat Aquapolis, Ghaziabad - 201009, UP');
  const [companyGst, setCompanyGst] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('https://barktechnologies.in');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // AI Model management state
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [aiModelsLoading, setAiModelsLoading] = useState(true);
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModel, setNewModel] = useState({ name: '', modelId: '', description: '', role: 'admin' as 'client' | 'admin', maxTokens: 2048, temperature: 0.2 });
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  const getToken = () => localStorage.getItem('bark_auth_token') || localStorage.getItem('bark_auth_token');

  // ── AI Model management ──
  const fetchModels = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/ai-models', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAiModels(data.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setAiModelsLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const addModel = async () => {
    setAiError('');
    if (!newModel.name.trim() || !newModel.modelId.trim()) {
      setAiError('Name and Model ID are required');
      return;
    }
    setAiActionLoading('add');
    try {
      const token = getToken();
      const res = await fetch('/api/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newModel),
      });
      if (res.ok) {
        setNewModel({ name: '', modelId: '', description: '', role: 'admin', maxTokens: 2048, temperature: 0.2 });
        setShowAddModel(false);
        fetchModels();
      } else {
        const err = await res.json();
        setAiError(err.error || 'Failed to add model');
      }
    } catch {
      setAiError('Failed to connect to server');
    } finally {
      setAiActionLoading(null);
    }
  };

  const deleteModel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    setAiActionLoading(id);
    try {
      const token = getToken();
      const res = await fetch(`/api/ai-models/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchModels();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete model');
      }
    } catch {
      alert('Failed to connect to server');
    } finally {
      setAiActionLoading(null);
    }
  };

  const setDefault = async (id: string) => {
    setAiActionLoading(id);
    try {
      const token = getToken();
      const res = await fetch(`/api/ai-models/${id}/set-default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchModels();
    } catch {
      // silently fail
    } finally {
      setAiActionLoading(null);
    }
  };

  const toggleActive = async (id: string) => {
    setAiActionLoading(id);
    try {
      const token = getToken();
      const res = await fetch(`/api/ai-models/${id}/toggle-active`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchModels();
    } catch {
      // silently fail
    } finally {
      setAiActionLoading(null);
    }
  };

  // ── Company save ──
  const handleSaveCompany = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Password change ──
  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    try {
      const token = getToken();
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSaved(false), 2000);
      } else {
        setPasswordError('Current password is incorrect');
      }
    } catch {
      setPasswordError('Failed to change password');
    }
  };

  const clientModels = aiModels.filter(m => m.role === 'client');
  const adminModels = aiModels.filter(m => m.role === 'admin');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-black dark:text-white">Settings</h2>
      </div>

      {/* Appearance */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black dark:text-white">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
            </div>
            <button onClick={toggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Management */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
                <Bot className="h-4 w-4" />
                AI Model Management
              </CardTitle>
              <CardDescription>Add, remove, or set default AI models for the agent</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddModel(!showAddModel)} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add Model
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {aiError && (
            <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{aiError}</div>
          )}

          {/* Add Model Form */}
          {showAddModel && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-sm font-medium text-black dark:text-white">New AI Model</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                  <Input
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    placeholder="e.g. GPT-4o Mini"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Model ID (OpenRouter)</label>
                  <Input
                    value={newModel.modelId}
                    onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                    placeholder="e.g. openai/gpt-4o-mini"
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Description</label>
                  <Input
                    value={newModel.description}
                    onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                    placeholder="Brief description of this model"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Role</label>
                  <select
                    value={newModel.role}
                    onChange={(e) => setNewModel({ ...newModel, role: e.target.value as 'client' | 'admin' })}
                    className="mt-1 flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm text-black dark:text-white"
                  >
                    <option value="admin">Admin Agent</option>
                    <option value="client">Client Agent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Max Tokens</label>
                  <Input
                    type="number"
                    value={newModel.maxTokens}
                    onChange={(e) => setNewModel({ ...newModel, maxTokens: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Temperature (0-2)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={newModel.temperature}
                    onChange={(e) => setNewModel({ ...newModel, temperature: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowAddModel(false); setAiError(''); }}>Cancel</Button>
                <Button size="sm" onClick={addModel} disabled={aiActionLoading === 'add'} className="gap-1">
                  {aiActionLoading === 'add' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Add Model
                </Button>
              </div>
            </div>
          )}

          {aiModelsLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading models...
            </div>
          ) : (
            <>
              {/* Client Models */}
              <div>
                <h4 className="text-sm font-semibold text-black dark:text-white mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">Client</span>
                  Client-Facing Agent Models
                </h4>
                {clientModels.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No client models configured</p>
                ) : (
                  <div className="space-y-2">
                    {clientModels.map((model) => (
                      <ModelRow key={model._id} model={model} loading={aiActionLoading} onDefault={setDefault} onToggle={toggleActive} onDelete={deleteModel} />
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Models */}
              <div>
                <h4 className="text-sm font-semibold text-black dark:text-white mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">Admin</span>
                  Admin Agent Models
                </h4>
                {adminModels.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No admin models configured</p>
                ) : (
                  <div className="space-y-2">
                    {adminModels.map((model) => (
                      <ModelRow key={model._id} model={model} loading={aiActionLoading} onDefault={setDefault} onToggle={toggleActive} onDelete={deleteModel} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
            <Building2 className="h-4 w-4" />
            Company Information
          </CardTitle>
          <CardDescription>Update your business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Company Name</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Website</label>
              <div className="flex items-center mt-1">
                <Globe className="absolute left-3 h-4 w-4 text-gray-400 ml-3" />
                <Input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Phone Number</label>
              <div className="flex items-center mt-1">
                <Phone className="absolute left-3 h-4 w-4 text-gray-400 ml-3" />
                <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Email</label>
              <div className="flex items-center mt-1">
                <Mail className="absolute left-3 h-4 w-4 text-gray-400 ml-3" />
                <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-black dark:text-white">Address</label>
              <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="mt-1 flex min-h-[70px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-black dark:text-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-black dark:text-white">GST Number</label>
              <Input value={companyGst} onChange={(e) => setCompanyGst(e.target.value)} placeholder="GSTIN (optional)" className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveCompany} className="gap-2">
              {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Profile */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
            <User className="h-4 w-4" />
            Admin Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Full Name</label>
              <Input value={user.fullName || ''} disabled className="mt-1 bg-gray-50 dark:bg-gray-800" />
            </div>
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Email</label>
              <Input value={user.email || ''} disabled className="mt-1 bg-gray-50 dark:bg-gray-800" />
            </div>
            <div>
              <label className="text-sm font-medium text-black dark:text-white">Role</label>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Shield className="h-3 w-3" />
                  {user.role?.replace('_', ' ') || 'admin'}
                </span>
              </div>
            </div>
          </div>
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
        <CardContent className="space-y-4">
          {passwordError && (
            <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{passwordError}</div>
          )}
          {passwordSaved && (
            <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-600 dark:text-green-400">Password changed successfully!</div>
          )}
          <div>
            <label className="text-sm font-medium text-black dark:text-white">Current Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="pl-9 pr-10" />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-black dark:text-white">New Password</label>
            <div className="relative mt-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" className="pl-9 pr-10" />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-black dark:text-white">Confirm New Password</label>
            <Input type={showNewPw ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className="mt-1" />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleChangePassword} disabled={!currentPassword || !newPassword || !confirmPassword} className="gap-2">
              <Lock className="h-4 w-4" />
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Integrations */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-black dark:text-white">
            <Key className="h-4 w-4" />
            API Integrations
          </CardTitle>
          <CardDescription>Manage external service connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'OpenRouter (AI Models)', status: 'connected', desc: 'AI model provider — configurable in AI Model Management above' },
              { name: 'MongoDB Atlas', status: 'connected', desc: 'Primary database — Cluster0' },
              { name: 'Redis (Upstash)', status: 'connected', desc: 'Cache and rate limiting' },
              { name: 'Resend (Email)', status: 'connected', desc: 'Transactional email delivery' },
              { name: 'WhatsApp Business', status: 'not configured', desc: 'Admin notifications and customer follow-ups' },
              { name: 'Google Calendar', status: 'not configured', desc: 'Installation and demo scheduling' },
              { name: 'S3 / Cloudflare R2', status: 'not configured', desc: 'Media and PDF storage' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${service.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">{service.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{service.desc}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${service.status === 'connected' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-900">
            <div>
              <p className="text-sm font-medium text-black dark:text-white">Sign Out of All Devices</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">This will revoke all active sessions</p>
            </div>
            <Button variant="outline" size="sm" className="text-red-600 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950">
              Sign Out All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Model Row Component ──
function ModelRow({ model, loading, onDefault, onToggle, onDelete }: {
  model: AIModel;
  loading: string | null;
  onDefault: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
      model.isDefault
        ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${model.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-black dark:text-white truncate">{model.name}</p>
            {model.isDefault && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Star className="h-2.5 w-2.5" />
                DEFAULT
              </span>
            )}
            {!model.isActive && (
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                DISABLED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{model.modelId}</p>
          {model.description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{model.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 ml-3">
        {!model.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => onDefault(model._id)}
            disabled={loading === model._id}
            title="Set as default"
          >
            <Star className="h-3 w-3" />
            Default
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs gap-1 ${model.isActive ? 'text-green-600' : 'text-gray-400'}`}
          onClick={() => onToggle(model._id)}
          disabled={loading === model._id}
          title={model.isActive ? 'Disable model' : 'Enable model'}
        >
          {model.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
          {model.isActive ? 'On' : 'Off'}
        </Button>
        {!model.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => onDelete(model._id)}
            disabled={loading === model._id}
            title="Delete model"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
