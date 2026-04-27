'use client';

import { useEffect, useState } from 'react';
import { apiClient, BACKEND_BASE } from './api';
import { ImageOff } from 'lucide-react';

interface AuthImageProps {
  /** Stored path, e.g. /uploads/id-documents/abc.jpg */
  src: string | null | undefined;
  userId: number;
  alt?: string;
  className?: string;
  onClick?: (blobUrl: string) => void;
}

/**
 * Fetches a protected upload (id-documents) via the authenticated API endpoint
 * using the existing httpOnly cookie session, then renders it as a blob URL.
 * Required because /uploads/id-documents/ blocks all direct requests.
 */
export function AuthImage({ src, userId, alt = 'ID Document', className, onClick }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    let objectUrl = '';

    // Extract just the filename from the stored path
    const filename = src.split('/').pop();
    if (!filename) {
      setLoading(false);
      setError(true);
      return;
    }

    apiClient
      .get(`/users/${userId}/id-document/${filename}`, { responseType: 'blob' })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data as Blob);
        setBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <ImageOff className="h-7 w-7 text-gray-600" />
        <p className="text-gray-500 text-xs">Could not load image</p>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onClick={() => onClick?.(blobUrl)}
    />
  );
}
