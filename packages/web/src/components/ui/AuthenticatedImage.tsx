'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Props {
  /** Relative path stored in DB, e.g. "messages/5/img-123.jpg" */
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Fetches a protected image endpoint with the Bearer token and renders it
 * as a blob URL so the browser never hits the blocked /uploads/* path.
 *
 * Supports message image paths of the form "messages/:convId/:filename".
 */
export default function AuthenticatedImage({ src, alt = '', className, onClick }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    let revoked = false;
    let blobUrl = '';

    // Build the API URL from the relative path "messages/:convId/:filename"
    const parts = src.split('/');
    let fetchUrl: string;
    if (parts[0] === 'messages' && parts.length >= 3) {
      const [, convId, ...rest] = parts;
      fetchUrl = `/messages/conversations/${convId}/image/${rest.join('/')}`;
    } else {
      // Fallback: try fetching as-is under /uploads
      fetchUrl = `/uploads/${src}`;
    }

    apiClient
      .get(fetchUrl, { responseType: 'blob' })
      .then((res) => {
        if (revoked) return;
        blobUrl = URL.createObjectURL(res.data as Blob);
        setObjectUrl(blobUrl);
      })
      .catch(() => {
        if (!revoked) setError(true);
      });

    return () => {
      revoked = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs ${className ?? ''}`}>
        Image unavailable
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className={`animate-pulse bg-neutral-200 ${className ?? ''}`} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={objectUrl} alt={alt} className={className} onClick={onClick} />
  );
}
