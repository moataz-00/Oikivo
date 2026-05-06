'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Grid3X3, ImageOff } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import type { PropertyImage } from '@/types';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  images: PropertyImage[];
  title: string;
}

/** Wrapper that gracefully falls back to a placeholder when an image fails to load. */
function GalleryImage({
  src,
  alt,
  fill,
  className,
  priority,
  sizes,
  quality,
  loading,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  loading?: 'eager' | 'lazy';
}) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100">
        <ImageOff className="h-8 w-8 text-neutral-300" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes}
      quality={quality}
      loading={loading}
      onError={() => setErrored(true)}
    />
  );
}


export function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Pre-compute image URLs to avoid recalculating during renders
  const imageUrls = useMemo(
    () => images.map((img) => getImageUrl(img.url)),
    [images],
  );

  const mainImage = images[0];
  const gridImages = images.slice(1, 5);
  const remainingCount = Math.max(0, images.length - 5);

  const navigate = useCallback(
    (dir: 'prev' | 'next') => {
      setActiveIndex((prev) => {
        if (dir === 'prev') return prev === 0 ? images.length - 1 : prev - 1;
        return prev === images.length - 1 ? 0 : prev + 1;
      });
    },
    [images.length],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!galleryOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      else if (e.key === 'ArrowRight') navigate('next');
      else if (e.key === 'Escape') setGalleryOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [galleryOpen, navigate]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!galleryOpen || !thumbnailRef.current) return;
    const el = thumbnailRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeIndex, galleryOpen]);

  // Lock body scroll when gallery open
  useEffect(() => {
    if (galleryOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [galleryOpen]);

  // Touch swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 50) {
        navigate(diff > 0 ? 'next' : 'prev');
      }
    },
    [navigate],
  );

  if (!images || images.length === 0) {
    return (
      <div className="h-72 sm:h-96 w-full rounded-2xl bg-neutral-200 flex items-center justify-center">
        <span className="text-neutral-400">No photos available</span>
      </div>
    );
  }

  return (
    <>
      {/* Grid layout */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-[320px] sm:h-[480px]">
          {/* Main large photo */}
          <div className="relative col-span-1 row-span-2">
            {mainImage && (
              <button
                onClick={() => { setActiveIndex(0); setGalleryOpen(true); }}
                className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-l-2xl overflow-hidden"
              >
                <GalleryImage
                  src={imageUrls[0]}
                  alt={`${title} - photo 1`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={80}
                />
              </button>
            )}
          </div>

          {/* Right 2x2 grid */}
          <div className="hidden sm:grid grid-cols-2 gap-2">
            {gridImages.map((img, idx) => (
              <div key={img.id} className="relative h-full">
                <button
                  onClick={() => { setActiveIndex(idx + 1); setGalleryOpen(true); }}
                  className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 overflow-hidden"
                >
                  <GalleryImage
                    src={imageUrls[idx + 1]}
                    alt={`${title} - photo ${idx + 2}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    quality={75}
                    loading="eager"
                  />
                  {/* Show remaining count overlay on last grid image */}
                  {idx === gridImages.length - 1 && remainingCount > 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">+{remainingCount}</span>
                    </div>
                  )}
                </button>
              </div>
            ))}
            {/* Fill empty slots if fewer than 4 side images */}
            {gridImages.length < 4 &&
              Array.from({ length: 4 - gridImages.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-neutral-200 rounded" />
              ))}
          </div>
        </div>

        {/* Show all photos button */}
        {images.length > 1 && (
          <button
            onClick={() => { setActiveIndex(0); setGalleryOpen(true); }}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors shadow"
          >
            <Grid3X3 className="h-4 w-4" />
            Show all photos ({images.length})
          </button>
        )}
      </div>

      {/* Fullscreen gallery modal */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => setGalleryOpen(false)}
              className="flex items-center gap-2 text-white hover:text-neutral-300 transition-colors"
            >
              <X className="h-6 w-6" />
              <span className="text-sm font-medium">Close</span>
            </button>
            <span className="text-sm text-white font-medium tabular-nums">
              {activeIndex + 1} / {images.length}
            </span>
            {/* Grid/Single toggle */}
            <button
              onClick={() => setViewMode((m) => (m === 'single' ? 'grid' : 'single'))}
              className="flex items-center gap-1.5 text-white hover:text-neutral-300 transition-colors text-sm"
            >
              <Grid3X3 className="h-5 w-5" />
              {viewMode === 'single' ? 'Grid' : 'Single'}
            </button>
          </div>

          {viewMode === 'single' ? (
            <>
              {/* Single image view — all images stacked, only active one visible.
                  No remount on navigate → instant switching, no extra network requests. */}
              <div className="flex h-full items-center justify-center px-4 sm:px-16 pt-16 pb-24">
                <div className="relative w-full max-w-5xl" style={{ height: 'calc(100vh - 160px)' }}>
                  {images.map((_, idx) => (
                    <GalleryImage
                      key={idx}
                      src={imageUrls[idx] ?? ''}
                      alt={`${title} - photo ${idx + 1}`}
                      fill
                      className={cn(
                        'object-contain transition-opacity duration-150',
                        idx === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none',
                      )}
                      sizes="100vw"
                      quality={90}
                      priority={idx === 0}
                      loading={idx < 5 ? 'eager' : 'lazy'}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigate('prev')}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => navigate('next')}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </>
          ) : (
            /* Grid view — all photos */
            <div className="h-full overflow-y-auto pt-16 pb-8 px-4">
              <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => { setActiveIndex(idx); setViewMode('single'); }}
                    className={cn(
                      'relative aspect-[4/3] overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      idx === 0 && 'col-span-2 row-span-2',
                    )}
                  >
                    <GalleryImage
                      src={imageUrls[idx]}
                      alt={`${title} - photo ${idx + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes={idx === 0 ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 50vw, 33vw'}
                      quality={70}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                      {idx + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thumbnails strip — single view only */}
          {viewMode === 'single' && images.length > 1 && (
            <div
              ref={thumbnailRef}
              className="absolute bottom-4 left-0 right-0 flex justify-start gap-1.5 px-4 overflow-x-auto scrollbar-none"
            >
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                    activeIndex === idx
                      ? 'border-white scale-110 shadow-lg shadow-white/20'
                      : 'border-transparent opacity-50 hover:opacity-90',
                  )}
                >
                  <GalleryImage
                    src={imageUrls[idx]}
                    alt={`thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    quality={50}
                    loading="eager"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
