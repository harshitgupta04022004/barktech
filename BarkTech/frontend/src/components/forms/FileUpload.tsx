import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadApi, type UploadResult } from '@/api/upload';

export interface UploadedFileInfo {
  file: File;
  url: string;
  key: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  result?: UploadResult;
}

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  folder?: string;
  onFilesChange?: (files: UploadedFileInfo[]) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.mp4,.webm,.mov',
  maxSizeMB = 50,
  multiple = false,
  folder = 'uploads',
  onFilesChange,
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());

  const emitCompleted = (fileList: UploadedFile[]) => {
    const completed: UploadedFileInfo[] = [];
    for (const f of fileList) {
      if (f.status === 'done' && f.result?.success && f.result.url && f.result.key) {
        completed.push({ file: f.file, url: f.result.url, key: f.result.key });
      }
    }
    onFilesChange?.(completed);
  };

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setError(null);
      const newFiles: UploadedFile[] = [];

      for (const file of Array.from(fileList)) {
        if (file.size > maxSizeBytes) {
          setError(`"${file.name}" exceeds ${maxSizeMB}MB limit`);
          continue;
        }
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(ext)) {
          setError(`"${file.name}" is not an accepted file type`);
          continue;
        }
        const uploadedFile: UploadedFile = { file, progress: 0, status: 'uploading' };
        if (file.type.startsWith('image/')) {
          uploadedFile.preview = URL.createObjectURL(file);
        }
        newFiles.push(uploadedFile);
      }

      if (newFiles.length === 0) return;

      const prevLen = multiple ? files.length : 0;
      setFiles(prev => (multiple ? [...prev, ...newFiles] : [...newFiles]));

      for (let i = 0; i < newFiles.length; i++) {
        const globalIdx = prevLen + i;
        const result = await uploadApi.uploadFile(newFiles[i].file, {
          folder,
          onProgress: (percent) => {
            setFiles(prev => {
              const updated = [...prev];
              if (updated[globalIdx]) updated[globalIdx] = { ...updated[globalIdx], progress: percent };
              return updated;
            });
          },
        });

        setFiles(prev => {
          const updated = [...prev];
          if (updated[globalIdx]) {
            updated[globalIdx] = {
              ...updated[globalIdx],
              progress: result.success ? 100 : 0,
              status: result.success ? 'done' : 'error',
              result,
            };
          }
          emitCompleted(updated);
          return updated;
        });
      }
    },
    [maxSizeBytes, acceptedTypes, maxSizeMB, multiple, files.length, folder, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles(prev => {
        const updated = prev.filter((_, i) => i !== index);
        emitCompleted(updated);
        return updated;
      });
    },
    [onFilesChange]
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); if (!disabled && e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files); }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary hover:bg-muted',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <Upload className={cn('mb-3 h-8 w-8', isDragging ? 'text-primary' : 'text-muted-foreground')} />
        <p className="text-sm font-medium text-foreground">
          {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Images, Videos, PDFs &mdash; Max {maxSizeMB}MB {multiple ? '(multiple files)' : ''}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={e => { if (e.target.files && e.target.files.length > 0) { processFiles(e.target.files); e.target.value = ''; } }}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploaded, idx) => (
            <div
              key={`${uploaded.file.name}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              {uploaded.preview ? (
                <img src={uploaded.preview} alt={uploaded.file.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{uploaded.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        uploaded.status === 'done' ? 'bg-green-500' :
                        uploaded.status === 'error' ? 'bg-red-500' : 'bg-primary'
                      )}
                      style={{ width: `${uploaded.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {uploaded.status === 'done' ? (
                      <Check className="h-3.5 w-3.5 text-green-500 inline" />
                    ) : uploaded.status === 'error' ? (
                      'Failed'
                    ) : (
                      `${Math.round(uploaded.progress)}%`
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(uploaded.file.size / 1024 / 1024).toFixed(2)} MB
                  {uploaded.result?.url && (
                    <span className="text-green-600 ml-2">Stored in S3</span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
