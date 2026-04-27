'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindowF, MarkerF } from '@react-google-maps/api';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Star, X } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { getImageUrl, formatRating } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import type { Property } from '@/types';

interface MapViewProps {
  properties: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onBoundsChange?: (bounds: google.maps.LatLngBounds) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

export function MapView({ properties, center, zoom = 12, onBoundsChange }: MapViewProps) {
  const locale = useLocale();
  const { formatPrice } = useCurrency();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: ['places'],
  });

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (onBoundsChange) {
      mapInstance.addListener('idle', () => {
        const bounds = mapInstance.getBounds();
        if (bounds) onBoundsChange(bounds);
      });
    }
  }, [onBoundsChange]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-100 rounded-xl">
        <p className="text-sm text-neutral-500">Map unavailable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-100 rounded-xl">
        <Spinner size="lg" />
      </div>
    );
  }

  const mapCenter = center ?? (
    properties.length > 0
      ? { lat: properties[0].lat, lng: properties[0].lng }
      : defaultCenter
  );
  const selectedAvgRatingText = selectedProperty ? formatRating(selectedProperty.avgRating) : null;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={zoom}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {properties.map((property) => (
        <MarkerF
          key={property.id}
          position={{ lat: property.lat, lng: property.lng }}
          onClick={() => setSelectedProperty(property)}
          icon={{
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="32">
                <rect rx="16" ry="16" width="80" height="32" fill="${selectedProperty?.id === property.id ? '#222' : '#fff'}" stroke="${selectedProperty?.id === property.id ? '#222' : '#ddd'}" stroke-width="1.5"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="${selectedProperty?.id === property.id ? '#fff' : '#222'}">
                  ${formatPrice(property.price)}
                </text>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(80, 32),
            anchor: new google.maps.Point(40, 16),
          }}
        />
      ))}

      {selectedProperty && (
        <InfoWindowF
          position={{ lat: selectedProperty.lat, lng: selectedProperty.lng }}
          onCloseClick={() => setSelectedProperty(null)}
          options={{ pixelOffset: new google.maps.Size(0, -20) }}
        >
          <div className="w-64 rounded-xl overflow-hidden">
            <Link
              href={`/${locale}/rooms/${selectedProperty.uuid || selectedProperty.id}`}
              className="block hover:opacity-95 transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* Image */}
              <div className="relative h-36 w-full">
                {selectedProperty.images?.[0] ? (
                  <Image
                    src={getImageUrl(selectedProperty.images[0].url)}
                    alt={selectedProperty.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-200" />
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-semibold text-neutral-900 text-sm truncate">{selectedProperty.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{selectedProperty.city}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-neutral-900">
                    <span className="font-semibold">
                      {formatPrice(selectedProperty.price)}
                    </span>
                    <span className="text-neutral-500">
                      {' / night'}
                    </span>
                  </p>
                  {selectedAvgRatingText !== null && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
                      <span className="text-xs font-medium">{selectedAvgRatingText}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
