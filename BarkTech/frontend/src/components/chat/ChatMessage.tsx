import { useState, useCallback } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Wrench, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage as ChatMessageType } from '@/stores/chatStore';
import type { ChatFile } from '@/api/agentChat';

interface ChatMessageProps {
  message: ChatMessageType;
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="relative my-3 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-1.5">
        <span className="text-xs text-[#999]">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-[#999] hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '13px',
          lineHeight: '1.5',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

function ToolCallBlock({ name, args }: { name: string; args: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 rounded-lg border border-[#e5e0d6] dark:border-[#3d3a35] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#666] dark:text-[#999] hover:bg-[#f0ece0] dark:hover:bg-[#2a2a2a] transition-colors"
      >
        <Wrench className="h-3 w-3" />
        <span className="font-medium">Used tool: {name}</span>
        {expanded ? (
          <ChevronDown className="ml-auto h-3 w-3" />
        ) : (
          <ChevronRight className="ml-auto h-3 w-3" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-[#e5e0d6] dark:border-[#3d3a35] bg-[#f9f7f2] dark:bg-[#222] px-3 py-2">
          <pre className="text-xs text-[#666] dark:text-[#999] overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function FileAttachment({ file }: { file: ChatFile }) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  if (file.preview) {
    return (
      <div className="mt-1.5">
        <img
          src={file.preview}
          alt={file.filename}
          className="max-h-48 rounded-lg border border-[#e5e0d6] dark:border-[#3d3a35] object-contain"
        />
        <p className="mt-1 text-[10px] text-[#999]">{file.filename} ({formatSize(file.size)})</p>
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[#e5e0d6] dark:border-[#3d3a35] bg-[#f8f5ef] dark:bg-[#3d3a35] px-2.5 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded bg-[#e5e0d6] dark:bg-[#2a2a2a]">
        <FileText className="h-4 w-4 text-[#666] dark:text-[#999]" />
      </span>
      <div>
        <p className="text-xs font-medium text-[#1a1a1a] dark:text-[#f5f0e8]">{file.filename}</p>
        <p className="text-[10px] text-[#999]">{formatSize(file.size)}</p>
      </div>
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end py-4">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#f0ece0] dark:bg-[#3d3a35] px-4 py-3 text-sm text-[#1a1a1a] dark:text-[#f5f0e8]">
          {/* File attachments */}
          {message.files && message.files.length > 0 && (
            <div className="mb-2">
              {message.files.map((file) => (
                <FileAttachment key={file.id} file={file} />
              ))}
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="group flex items-start gap-3 py-4">
      {/* Avatar */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e65100]/10 mt-0.5">
        <span className="text-xs font-bold text-[#e65100]">BT</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Tool calls */}
        {message.toolCalls?.map((tc, i) => (
          <ToolCallBlock key={i} name={tc.name} args={tc.args} />
        ))}

        {/* Message content */}
        {message.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-strong:font-semibold prose-code:text-xs prose-code:bg-[#f0ece0] dark:prose-code:bg-[#3d3a35] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:p-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  if (match) {
                    return <CodeBlock language={match[1]} children={codeString} />;
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Copy button — visible on hover */}
        {message.content && (
          <button
            onClick={handleCopy}
            className="mt-2 flex items-center gap-1 text-xs text-[#999] hover:text-[#666] dark:hover:text-[#ccc] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}
