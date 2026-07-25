import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowUp, Square, X, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatFile } from '@/api/agentChat';

interface ComposerProps {
 onSend: (message: string, files: ChatFile[]) => void;
 onStop: () => void;
 isStreaming: boolean;
 isUploading?: boolean;
 onUpload?: (files: File[]) => Promise<ChatFile[]>;
}

const ACCEPTED_TYPES = [
 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
 'application/pdf', 'text/plain', 'text/csv', 'text/markdown',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function Composer({ onSend, onStop, isStreaming, isUploading = false, onUpload }: ComposerProps) {
 const [input, setInput] = useState('');
 const [files, setFiles] = useState<ChatFile[]>([]);
 const [isDragging, setIsDragging] = useState(false);
 const textareaRef = useRef<HTMLTextAreaElement>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Auto-resize textarea
 useEffect(() => {
 const textarea = textareaRef.current;
 if (textarea) {
 textarea.style.height = 'auto';
 textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
 }
 }, [input]);

 const validateFile = (file: File): string | null => {
 if (!ACCEPTED_TYPES.includes(file.type)) {
 return `Unsupported file type: ${file.type || 'unknown'}`;
 }
 if (file.size > MAX_FILE_SIZE) {
 return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 20MB.`;
 }
 return null;
 };

 const processFileForPreview = (file: File): Promise<string | undefined> => {
 return new Promise((resolve) => {
 if (file.type.startsWith('image/')) {
 const reader = new FileReader();
 reader.onload = (e) => resolve(e.target?.result as string);
 reader.onerror = () => resolve(undefined);
 reader.readAsDataURL(file);
 } else {
 resolve(undefined);
 }
 });
 };

 const handleFiles = useCallback(async (rawFiles: File[]) => {
 const validFiles: File[] = [];
 const newChatFiles: ChatFile[] = [];

 for (const file of rawFiles) {
 const error = validateFile(file);
 const preview = await processFileForPreview(file);
 const chatFile: ChatFile = {
 id: crypto.randomUUID(),
 filename: file.name,
 size: file.size,
 type: file.type,
 preview,
 status: error ? 'error' : 'uploading',
 error: error || undefined,
 };
 newChatFiles.push(chatFile);
 if (!error) validFiles.push(file);
 }

 setFiles((prev) => [...prev, ...newChatFiles]);

 // Upload valid files
 if (validFiles.length > 0 && onUpload) {
 try {
 // Mark as processing
 setFiles((prev) =>
 prev.map((f) =>
 newChatFiles.some((nf) => nf.id === f.id) && f.status === 'uploading'
 ? { ...f, status: 'processing' as const }
 : f
 )
 );

 const processedFiles = await onUpload(validFiles);

 // Update with processed data
 setFiles((prev) =>
 prev.map((f) => {
 const newFileIdx = newChatFiles.findIndex((nf) => nf.id === f.id);
 if (newFileIdx >= 0 && processedFiles[newFileIdx]) {
 return {
 ...f,
 status: 'ready' as const,
 processedData: processedFiles[newFileIdx].processedData,
 };
 }
 return f;
 })
 );
 } catch (err) {
 setFiles((prev) =>
 prev.map((f) =>
 newChatFiles.some((nf) => nf.id === f.id) && f.status !== 'error'
 ? { ...f, status: 'error' as const, error: 'Upload failed' }
 : f
 )
 );
 }
 }
 }, [onUpload]);

 const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
 const rawFiles = Array.from(e.target.files || []);
 if (rawFiles.length > 0) {
 handleFiles(rawFiles);
 }
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 }, [handleFiles]);

 const handleDrop = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 const rawFiles = Array.from(e.dataTransfer.files);
 if (rawFiles.length > 0) {
 handleFiles(rawFiles);
 }
 }, [handleFiles]);

 const handleDragOver = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(true);
 }, []);

 const handleDragLeave = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 }, []);

 const removeFile = useCallback((fileId: string) => {
 setFiles((prev) => prev.filter((f) => f.id !== fileId));
 }, []);

 const handleSubmit = useCallback(() => {
 if ((!input.trim() && files.length === 0) || isStreaming) return;
 onSend(input.trim() || 'Please analyze the attached files', files);
 setInput('');
 setFiles([]);
 if (textareaRef.current) {
 textareaRef.current.style.height = 'auto';
 }
 }, [input, files, isStreaming, onSend]);

 const handleKeyDown = useCallback(
 (e: React.KeyboardEvent) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSubmit();
 }
 },
 [handleSubmit]
 );

 const formatFileSize = (bytes: number) => {
 if (bytes < 1024) return `${bytes}B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
 return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
 };

 const getFileIcon = (type: string) => {
 if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
 return <FileText className="h-4 w-4" />;
 };

 return (
 <div
 className={cn(
 'rounded-2xl border bg-background border-border px-3.5 pt-3 pb-2.5 transition-all focus-within:shadow-md',
 isDragging
 ? 'border-primary shadow-lg ring-2 ring-primary/20'
 : 'border-border'
 )}
 onDrop={handleDrop}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 >
 {isDragging && (
 <div className="mb-2 flex items-center justify-center rounded-lg border-2 border-dashed border-[#e65100] bg-[#e65100]/5 p-4">
 <p className="text-sm text-[#e65100]">Drop files here to attach</p>
 </div>
 )}

 {files.length > 0 && (
 <div className="mb-2 flex flex-wrap gap-2">
 {files.map((file) => (
 <div
 key={file.id}
 className={cn(
 'relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs',
 file.status === 'error'
 ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400'
 : 'border-border bg-muted'
 )}
 >
 {file.preview ? (
 <img
 src={file.preview}
 alt={file.filename}
 className="h-8 w-8 rounded object-cover"
 />
 ) : (
 <span className={cn(
 'flex h-8 w-8 items-center justify-center rounded',
 file.status === 'error'
 ? 'bg-red-100 dark:bg-red-900/50'
 : 'bg-muted'
 )}>
 {getFileIcon(file.type)}
 </span>
 )}
 <div className="max-w-[120px]">
 <p className="truncate font-medium text-foreground">
 {file.filename}
 </p>
 <p className="text-[10px] text-muted-foreground">
 {file.status === 'uploading' && 'Uploading...'}
 {file.status === 'processing' && 'Processing...'}
 {file.status === 'ready' && formatFileSize(file.size)}
 {file.status === 'error' && (file.error || 'Error')}
 </p>
 </div>
 <button
 onClick={() => removeFile(file.id)}
 className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 ))}
 </div>
 )}

 <textarea
 ref={textareaRef}
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder={files.length > 0 ? 'Add a message about these files...' : 'How can I help you today?'}
 rows={1}
 disabled={isStreaming}
 className="w-full resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:opacity-50"
 />

 <div className="flex items-center justify-between pt-1">
 <div className="flex items-center gap-2">
 <input
 ref={fileInputRef}
 type="file"
 multiple
 accept={ACCEPTED_TYPES.join(',')}
 onChange={handleFileInput}
 className="hidden"
 />
 <button
 onClick={() => fileInputRef.current?.click()}
 disabled={isStreaming || isUploading}
 className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
 title={isUploading ? 'Uploading...' : 'Attach files (images, PDFs, text)'}
 >
 <Paperclip className="h-[18px] w-[18px]" />
 </button>
 </div>

 <div className="flex items-center gap-2">
 {isStreaming ? (
 <button
 onClick={onStop}
 className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
 title="Stop generating"
 >
 <Square className="h-4 w-4" fill="currentColor" />
 </button>
 ) : (
 <button
 onClick={handleSubmit}
 disabled={!input.trim() && files.length === 0}
 className={cn(
 'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
 input.trim() || files.length > 0
 ? 'bg-foreground text-background hover:opacity-90'
 : 'bg-muted text-muted-foreground cursor-not-allowed'
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
