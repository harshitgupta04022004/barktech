import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
}

export function FileUpload({
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif',
  maxSizeMB = 10,
  multiple = false,
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

  const processFiles = useCallback(
    (fileList: FileList) => {
      setError(null);
      const newFiles: UploadedFile[] = [];

      Array.from(fileList).forEach(file => {
        if (file.size > maxSizeBytes) {
          setError(`"${file.name}" exceeds ${maxSizeMB}MB limit`);
          return;
        }

        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(ext)) {
          setError(`"${file.name}" is not an accepted file type`);
          return;
        }

        const uploadedFile: UploadedFile = { file, progress: 0 };

        if (file.type.startsWith('image/')) {
          uploadedFile.preview = URL.createObjectURL(file);
        }

        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
          }
          setFiles(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(f => f.file === file);
            if (idx !== -1) updated[idx] = { ...updated[idx], progress };
            return updated;
          });
        }, 200);

        newFiles.push(uploadedFile);
      });

      if (newFiles.length > 0) {
        setFiles(prev => {
          const updated = multiple ? [...prev, ...newFiles] : newFiles;
          onFilesChange?.(updated.map(f => f.file));
          return updated;
        });
      }
    },
    [maxSizeBytes, acceptedTypes, maxSizeMB, multiple, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles(prev => {
        const updated = prev.filter((_, i) => i !== index);
        onFilesChange?.(updated.map(f => f.file));
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
            : 'border-gray-300 hover:border-primary hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary dark:hover:bg-gray-800/50',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <Upload className={cn('mb-3 h-8 w-8', isDragging ? 'text-primary' : 'text-gray-400 dark:text-gray-500')} />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Accepted: {accept} &mdash; Max {maxSizeMB}MB {multiple ? '(multiple files)' : ''}
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploaded, idx) => (
            <div
              key={`${uploaded.file.name}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
            >
              {uploaded.preview ? (
                <img src={uploaded.preview} alt={uploaded.file.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                  <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{uploaded.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        uploaded.progress >= 100 ? 'bg-green-500' : 'bg-primary'
                      )}
                      style={{ width: `${uploaded.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                    {uploaded.progress >= 100 ? 'Done' : `${Math.round(uploaded.progress)}%`}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {(uploaded.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:text-red-400 dark:hover:bg-gray-800 transition-colors"
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
