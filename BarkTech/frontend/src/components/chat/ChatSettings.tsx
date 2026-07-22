import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatSettings {
  model: string;
  temperature: number;
  streaming: boolean;
}

const availableModels = [
  { id: 'xiaomi/mimo-v2.5-pro', label: 'Mimo v2.5 Pro', description: 'Best for complex reasoning and analysis' },
  { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek v4 Flash', description: 'Fast responses, good for simple tasks' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', description: 'General purpose, balanced performance' },
];

interface ChatSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
}

export function ChatSettingsPanel({ open, onClose, settings, onSave }: ChatSettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettings>({ ...settings });

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-[340px] border-l border-[#e5e0d6] dark:border-[#3d3a35] bg-white dark:bg-[#222] shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e0d6] dark:border-[#3d3a35] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-[#f5f0e8]">Chat Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[#f0ece0] dark:hover:bg-[#3d3a35] transition-colors"
          >
            <X className="h-4 w-4 text-[#666] dark:text-[#999]" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Model Selection */}
          <div>
            <label className="text-xs font-medium text-[#666] dark:text-[#999] uppercase tracking-wider">
              Model
            </label>
            <div className="mt-2 space-y-2">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setLocalSettings({ ...localSettings, model: model.id })}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all',
                    localSettings.model === model.id
                      ? 'border-[#e65100] bg-[#e65100]/5 dark:bg-[#e65100]/10'
                      : 'border-[#e5e0d6] dark:border-[#3d3a35] hover:border-[#ccc] dark:hover:border-[#555]'
                  )}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#1a1a1a] dark:text-[#f5f0e8]">
                      {model.label}
                    </div>
                    <div className="text-xs text-[#999] mt-0.5">
                      {model.description}
                    </div>
                  </div>
                  {localSettings.model === model.id && (
                    <Check className="h-4 w-4 text-[#e65100] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="text-xs font-medium text-[#666] dark:text-[#999] uppercase tracking-wider">
              Temperature: {localSettings.temperature.toFixed(1)}
            </label>
            <p className="text-xs text-[#999] mt-1">
              Lower = more focused, Higher = more creative
            </p>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
              }
              className="mt-3 w-full accent-[#e65100]"
            />
            <div className="flex justify-between text-xs text-[#999] mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Streaming toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#1a1a1a] dark:text-[#f5f0e8]">
                Streaming
              </div>
              <div className="text-xs text-[#999] mt-0.5">
                Show responses as they are generated
              </div>
            </div>
            <button
              onClick={() =>
                setLocalSettings({ ...localSettings, streaming: !localSettings.streaming })
              }
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                localSettings.streaming ? 'bg-[#e65100]' : 'bg-[#ccc] dark:bg-[#555]'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  localSettings.streaming ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="border-t border-[#e5e0d6] dark:border-[#3d3a35] p-4">
          <button
            onClick={() => {
              onSave(localSettings);
              onClose();
            }}
            className="w-full rounded-lg bg-[#e65100] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d45100] transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
