import { useRef, useEffect, useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { agentChatApi, type ChatFile } from '@/api/agentChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Composer } from '@/components/chat/Composer';
import { EmptyState } from '@/components/chat/EmptyState';
import type { ChatSettings } from '@/components/chat/ChatSettings';

interface ChatAreaProps {
 settings?: ChatSettings;
}

export function ChatArea({ settings }: ChatAreaProps) {
 const {
 messages,
 isStreaming,
 activeThreadId,
 addMessage,
 setStreaming,
 updateLastMessage,
 addToolCall,
 createThread,
 } = useChatStore();

 const messagesEndRef = useRef<HTMLDivElement>(null);
 const abortRef = useRef<(() => void) | null>(null);
 const [isUploading, setIsUploading] = useState(false);

 // Auto-scroll to bottom on new messages
 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages]);

 const handleUpload = useCallback(async (files: File[]): Promise<ChatFile[]> => {
 setIsUploading(true);
 try {
 const processed = await agentChatApi.uploadFiles(files);
 return files.map((file, idx) => ({
 id: crypto.randomUUID(),
 filename: file.name,
 size: file.size,
 type: file.type,
 status: 'ready' as const,
 processedData: processed[idx],
 }));
 } catch (err) {
 return files.map((file) => ({
 id: crypto.randomUUID(),
 filename: file.name,
 size: file.size,
 type: file.type,
 status: 'error' as const,
 error: err instanceof Error ? err.message : 'Upload failed',
 }));
 } finally {
 setIsUploading(false);
 }
 }, []);

 const sendMessage = useCallback(
 async (content: string, files: ChatFile[] = []) => {
 if ((!content.trim() && files.length === 0) || isStreaming) return;

 // Create thread if none active
 let threadId = activeThreadId;
 if (!threadId) {
 threadId = createThread();
 }

 // Add user message with files
 addMessage({
 role: 'user',
 content,
 files: files.length > 0 ? files : undefined,
 });
 setStreaming(true);

 // Add empty assistant message for streaming
 addMessage({ role: 'assistant', content: '' });

 // Prepare processed file data for the backend
 const processedFiles = files
 .filter((f) => f.processedData !== undefined)
 .map((f) => f.processedData as Record<string, unknown>);

 const handle = agentChatApi.streamChat(
 content,
 threadId,
 {
 onChunk: (_chunk, fullContent) => {
 updateLastMessage(fullContent);
 },
 onDone: (fullContent, _usage) => {
 if (!fullContent) {
 updateLastMessage('No response received.');
 }
 setStreaming(false);
 },
 onError: (error) => {
 updateLastMessage(`Error: ${error}`);
 setStreaming(false);
 },
 onToolCall: (toolName, args) => {
 addToolCall(toolName, args);
 },
 },
 settings ? { model: settings.model, temperature: settings.temperature } : undefined,
 processedFiles.length > 0 ? processedFiles : undefined
 );

 abortRef.current = handle.abort;
 },
 [
 activeThreadId,
 isStreaming,
 addMessage,
 setStreaming,
 updateLastMessage,
 addToolCall,
 createThread,
 settings,
 ]
 );

 const handleStop = useCallback(() => {
 abortRef.current?.();
 setStreaming(false);
 }, [setStreaming]);

 const handleSuggestionClick = useCallback(
 (suggestion: string) => {
 sendMessage(suggestion);
 },
 [sendMessage]
 );

 return (
 <div className="flex flex-1 flex-col min-h-0">
 {/* Messages or Empty State */}
 <div className="flex-1 overflow-y-auto">
 {messages.length === 0 ? (
 <EmptyState onSuggestionClick={handleSuggestionClick} />
 ) : (
 <div className="mx-auto max-w-[768px] px-4 py-6">
 {messages.map((msg) => (
 <ChatMessage key={msg.id} message={msg} onSendMessage={sendMessage} />
 ))}
 {isStreaming && messages[messages.length - 1]?.content === '' && (
 <div className="flex items-start gap-3 py-4">
 <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e65100]/10">
 <span className="text-sm font-bold text-[#e65100]">BT</span>
 </div>
 <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
 <span className="animate-pulse">Thinking</span>
 <span className="animate-pulse [animation-delay:0.2s]">.</span>
 <span className="animate-pulse [animation-delay:0.4s]">.</span>
 <span className="animate-pulse [animation-delay:0.6s]">.</span>
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>
 )}
 </div>

 {/* Composer */}
 <div className="border-t border-border bg-background">
 <div className="mx-auto max-w-[768px] px-4 py-3">
 <Composer
 onSend={sendMessage}
 onStop={handleStop}
 isStreaming={isStreaming}
 isUploading={isUploading}
 onUpload={handleUpload}
 />
 <p className="mt-2 text-center text-xs text-muted-foreground">
 Bark Admin AI can make mistakes. Please double-check important information.
 </p>
 </div>
 </div>
 </div>
 );
}
