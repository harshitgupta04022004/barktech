import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function Composer({ onSend, onStop, isStreaming }: ComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="rounded-2xl border border-[#e5e0d6] dark:border-[#3d3a35] bg-white dark:bg-[#2a2a2a] px-3.5 pt-3 pb-2.5 transition-shadow focus-within:shadow-md">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="How can I help you today?"
        rows={1}
        disabled={isStreaming}
        className="w-full resize-none border-0 bg-transparent text-sm text-[#1a1a1a] dark:text-[#f5f0e8] placeholder:text-[#999] focus:outline-none focus:ring-0 disabled:opacity-50"
      />

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* File attach placeholder */}
          <button
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#999] hover:bg-[#f0ece0] dark:hover:bg-[#3d3a35] transition-colors disabled:opacity-30"
            title="File attachments (coming soon)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              onClick={onStop}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a] dark:bg-[#f5f0e8] text-white dark:text-[#1a1a1a] hover:opacity-90 transition-opacity"
              title="Stop generating"
            >
              <Square className="h-4 w-4" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                input.trim()
                  ? 'bg-[#1a1a1a] dark:bg-[#f5f0e8] text-white dark:text-[#1a1a1a] hover:opacity-90'
                  : 'bg-[#e5e0d6] dark:bg-[#3d3a35] text-[#999] cursor-not-allowed'
              )}
              title="Send message"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
