'use client';

import { useCallback, useRef, useState, useMemo } from 'react';
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api';
import { MapPin, Locate } from 'lucide-react';

const MAP_LIBRARIES: ('places')[] = ['places'];
const MAP_CONTAINER_STYLE = { width: '100%', height: '420px' };
const DEFAULT_CENTER = { lat: 26.8206, lng: 30.8025 }; // Egypt center
const DEFAULT_ZOOM = 6; // Country-level for Egypt

interface LocationData {
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

interface LocationMapPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationSelect: (data: LocationData) => void;
}

function reverseGeocode(
  lat: number,
  lng: number,
  callback: (data: Partial<LocationData>) => void
) {
  const geocoder = new window.google.maps.Geocoder();
  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
    if (status !== 'OK' || !results || results.length === 0) return;
    const best = results[0];
    const get = (type: string) =>
      best.address_components.find((c) => c.types.includes(type))?.long_name ?? '';

    const streetNumber = get('street_number');
    const route = get('route');
    const address = [streetNumber, route].filter(Boolean).join(' ') || best.formatted_address;
    const city =
      get('locality') ||
      get('administrative_area_level_2') ||
      get('administrative_area_level_1');
    const country = get('country');
    callback({ address, city, country });
  });
}

export function LocationMapPicker({ initialLat, initialLng, onLocationSelect }: LocationMapPickerProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAP_LIBRARIES,
  });

  const initialCenter =
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng }
      : DEFAULT_CENTER;

  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  const [locating, setLocating] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: 'greedy',
    styles: [
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    ],
  }), []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarker({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(15);
        reverseGeocode(lat, lng, (data) => {
          onLocationSelect({ address: '', city: '', country: '', ...data, lat, lng });
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationSelect]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
      reverseGeocode(lat, lng, (data) => {
        onLocationSelect({ address: '', city: '', country: '', ...data, lat, lng });
      });
    },
    [onLocationSelect]
  );

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setMarker({ lat, lng });
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(15);

    const get = (type: string) =>
      (place.address_components ?? []).find((c) => c.types.includes(type))?.long_name ?? '';

    const streetNumber = get('street_number');
    const route = get('route');
    const address =
      [streetNumber, route].filter(Boolean).join(' ') || place.formatted_address || '';
    const city =
      get('locality') ||
      get('administrative_area_level_2') ||
      get('administrative_area_level_1');
    const country = get('country');

    onLocationSelect({ address, city, country, lat, lng });
  }, [onLocationSelect]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Could not load Google Maps. Check your API key in environment settings.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
        <div className="flex flex-col items-center gap-2 text-neutral-400">
          <MapPin className="h-6 w-6 animate-pulse" />
          <p className="text-sm">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Autocomplete
          onLoad={(ac) => {
            autocompleteRef.current = ac;
            ac.setComponentRestrictions({ country: 'eg' });
          }}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Search for an address in Egypt…"
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          />
        </Autocomplete>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-50"
          title="Use my current location"
        >
          <Locate className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{locating ? 'Locating…' : 'My location'}</span>
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={marker ?? initialCenter}
          zoom={marker ? 15 : DEFAULT_ZOOM}
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
          options={mapOptions}
        >
          {marker && <Marker position={marker} animation={google.maps.Animation.DROP} />}
        </GoogleMap>
      </div>

      {marker ? (
        <p className="text-xs text-neutral-500">
          📍 {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)} — click the map to adjust, or search above.
        </p>
      ) : (
        <p className="text-xs text-neutral-500">
          Click anywhere on the map to pin your location, or search for an address above.
        </p>
      )}
    </div>
  );
}
