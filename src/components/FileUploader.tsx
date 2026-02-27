'use client';

import { useState, useCallback } from 'react';
import { Upload, X, File, Image, Video, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface UploadedFile {
  fileId: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface FileUploaderProps {
  value?: string;
  onChange?: (url: string, file?: UploadedFile) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

const FILE_TYPE_ICONS: Record<string, typeof File> = {
  'image/': Image,
  'video/': Video,
  'application/pdf': FileText,
};

function getFileIcon(mimeType: string) {
  for (const [prefix, icon] of Object.entries(FILE_TYPE_ICONS)) {
    if (mimeType.startsWith(prefix)) return icon;
  }
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function FileUploader({
  value,
  onChange,
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = false,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    setIsUploading(true);

    const validFiles = Array.from(files).filter((file) => {
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      if (multiple) {
        validFiles.forEach((file) => formData.append('files', file));
      } else {
        formData.append('file', validFiles[0]);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      if (multiple) {
        const newFiles: UploadedFile[] = result.files || [];
        setUploadedFiles((prev) => [...prev, ...newFiles]);
        newFiles.forEach((file) => onChange?.(file.url, file));
      } else {
        const uploadedFile: UploadedFile = {
          fileId: result.fileId,
          url: result.url,
          filename: validFiles[0].name,
          mimeType: result.mimeType,
          size: result.size,
        };
        setUploadedFiles([uploadedFile]);
        onChange?.(result.url, uploadedFile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [maxSize, multiple, onChange]);

  const handleRemove = useCallback(async (fileToRemove: UploadedFile) => {
    try {
      await fetch(`/api/upload/${fileToRemove.fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Failed to delete file:', err);
    }

    setUploadedFiles((prev) => {
      const updated = prev.filter((f) => f.fileId !== fileToRemove.fileId);
      if (!multiple && updated.length === 0) {
        onChange?.('');
      }
      return updated;
    });
  }, [multiple, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const displayFiles = value && !multiple && uploadedFiles.length === 0
    ? [{ fileId: '', url: value, filename: value.split('/').pop() || 'file', mimeType: '', size: 0 }]
    : uploadedFiles;

  return (
    <div className={cn('space-y-4', className)}>
      {!multiple && displayFiles.length > 0 ? (
        <div className="space-y-2">
          {displayFiles.map((file, index) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <div
                key={file.fileId || index}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    {file.size > 0 && (
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    )}
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => handleRemove(file)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            'border-border hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-destructive'
          )}
          onDrop={disabled ? undefined : handleDrop}
          onDragOver={disabled ? undefined : handleDragOver}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop or{' '}
                <label className="text-primary cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    disabled={disabled}
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </label>
              </p>
              {accept && (
                <p className="text-xs text-muted-foreground">
                  Accepted: {accept}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Max size: {formatFileSize(maxSize)}
              </p>
            </div>
          )}
        </div>
      )}

      {multiple && uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {uploadedFiles.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <div
                key={file.fileId}
                className="flex items-center justify-between p-2 border rounded bg-card text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{file.filename}</span>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleRemove(file)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
