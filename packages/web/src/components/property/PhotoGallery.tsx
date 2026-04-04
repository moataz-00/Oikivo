'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import type { PropertyImage } from '@/types';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const mainImage = images[0];
  const gridImages = images.slice(1, 5);

  const navigate = (dir: 'prev' | 'next') => {
    setActiveIndex((prev) => {
      if (dir === 'prev') return prev === 0 ? images.length - 1 : prev - 1;
      return prev === images.length - 1 ? 0 : prev + 1;
    });
  };

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
        <div className="grid grid-cols-2 gap-2 h-[480px]">
          {/* Main large photo */}
          <div className="relative col-span-1 row-span-2">
            {mainImage && (
              <button
                onClick={() => { setActiveIndex(0); setGalleryOpen(true); }}
                className="block h-full w-full"
              >
                <Image
                  src={getImageUrl(mainImage.url)}
                  alt={`${title} - photo 1`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </button>
            )}
          </div>

          {/* Right 2x2 grid */}
          <div className="grid grid-cols-2 gap-2">
            {gridImages.map((img, idx) => (
              <div key={img.id} className="relative h-full">
                <button
                  onClick={() => { setActiveIndex(idx + 1); setGalleryOpen(true); }}
                  className="block h-full w-full"
                >
                  <Image
                    src={getImageUrl(img.url)}
                    alt={`${title} - photo ${idx + 2}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </button>
              </div>
            ))}
            {/* Fill empty slots if fewer than 4 side images */}
            {gridImages.length < 4 &&
              Array.from({ length: 4 - gridImages.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-neutral-200" />
              ))}
          </div>
        </div>

        {/* Show all photos button */}
        <button
          onClick={() => { setActiveIndex(0); setGalleryOpen(true); }}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors shadow"
        >
          <span className="text-base leading-none">⊞</span>
          Show all photos
        </button>
      </div>

      {/* Fullscreen gallery modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
            <button
              onClick={() => setGalleryOpen(false)}
              className="flex items-center gap-2 text-white hover:text-neutral-300 transition-colors"
            >
              <X className="h-6 w-6" />
              <span className="text-sm font-medium">Close</span>
            </button>
            <span className="text-sm text-white">
              {activeIndex + 1} / {images.length}
            </span>
          </div>

          {/* Image */}
          <div className="flex h-full items-center justify-center px-12">
            <div className="relative max-h-[80vh] max-w-4xl w-full">
              <Image
                src={getImageUrl(images[activeIndex]?.url ?? '')}
                alt={`${title} - photo ${activeIndex + 1}`}
                width={1200}
                height={800}
                className="mx-auto max-h-[80vh] w-auto object-contain"
              />
            </div>
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => navigate('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  activeIndex === idx ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <Image
                  src={getImageUrl(img.url)}
                  alt={`thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
