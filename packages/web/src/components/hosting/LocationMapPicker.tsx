'use client';

import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { MapPin, Locate, Search, CheckCircle2, AlertCircle } from 'lucide-react';

const MAP_LIBRARIES: ('places')[] = ['places'];
const MAP_CONTAINER_STYLE = { width: '100%', height: '380px' };
const DEFAULT_CENTER = { lat: 26.8206, lng: 30.8025 };
const DEFAULT_ZOOM = 6;

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

  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise AutocompleteService once the Maps SDK is loaded
  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [isLoaded]);

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
    mapTypeId: 'roadmap',
    styles: [
      { featureType: 'poi.business', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e9f6' }] },
      { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#fafafa' }] },
    ],
  }), []);

  const applyLocation = useCallback((lat: number, lng: number) => {
    setMarker({ lat, lng });
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(16);
    reverseGeocode(lat, lng, (data) => {
      onLocationSelect({ address: '', city: '', country: '', ...data, lat, lng });
    });
  }, [onLocationSelect]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocation(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocateError('Location access denied. Please allow location in your browser settings.');
        } else if (err.code === err.TIMEOUT) {
          setLocateError('Location request timed out. Try again.');
        } else {
          setLocateError('Could not get your location. Try searching instead.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [applyLocation]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      applyLocation(e.latLng.lat(), e.latLng.lng());
    },
    [applyLocation]
  );

  // Fetch predictions with 250ms debounce
  const fetchPredictions = useCallback((input: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!input.trim() || !autocompleteServiceRef.current) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      autocompleteServiceRef.current!.getPlacePredictions(
        { input, types: ['geocode', 'establishment'] },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setShowDropdown(true);
          } else {
            setPredictions([]);
            setShowDropdown(false);
          }
        }
      );
    }, 250);
  }, []);

  // Resolve a prediction to coordinates + address components
  const handlePredictionSelect = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      setShowDropdown(false);
      setPredictions([]);
      setQuery(prediction.description);
      if (!mapRef.current) return;
      const placesService = new google.maps.places.PlacesService(mapRef.current);
      placesService.getDetails(
        { placeId: prediction.place_id, fields: ['geometry', 'address_components', 'formatted_address'] },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
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
          setMarker({ lat, lng });
          mapRef.current?.panTo({ lat, lng });
          mapRef.current?.setZoom(16);
          onLocationSelect({ address, city, country, lat, lng });
        }
      );
    },
    [onLocationSelect]
  );

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-700">Map unavailable</p>
          <p className="text-xs text-red-500 mt-0.5">Could not load Google Maps. Check your API key in environment settings.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[380px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <div className="relative">
            <MapPin className="h-8 w-8 text-indigo-300" />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 animate-ping" />
          </div>
          <p className="text-sm font-medium">Loading map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2.5">
        {/* ── Search input with custom suggestions dropdown ── */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); fetchPredictions(e.target.value); }}
            onFocus={() => predictions.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search address, landmark, hotel, area"
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          />

          {/* Custom suggestions dropdown */}
          {showDropdown && predictions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
              {predictions.map((p, i) => (
                <button
                  key={p.place_id}
                  type="button"
                  onMouseDown={() => handlePredictionSelect(p)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${i < predictions.length - 1 ? 'border-b border-neutral-100' : ''}`}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">
                      {p.structured_formatting.main_text}
                    </span>
                    {p.structured_formatting.secondary_text && (
                      <span className="block truncate text-xs text-neutral-500">
                        {p.structured_formatting.secondary_text}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {/* Required Google attribution */}
              <div className="border-t border-neutral-100 px-4 py-1.5 text-right">
                <span className="text-[10px] text-neutral-400">Powered by Google</span>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition disabled:opacity-50 whitespace-nowrap"
        >
          <Locate className={`h-4 w-4 ${locating ? 'animate-spin text-indigo-500' : ''}`} />
          <span className="hidden sm:inline">{locating ? 'Locating' : 'Use my location'}</span>
        </button>
      </div>

      {locateError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {locateError}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={marker ?? DEFAULT_CENTER}
          zoom={marker ? 16 : DEFAULT_ZOOM}
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
          options={mapOptions}
        >
          {marker && (
            <Marker
              position={marker}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>

        {!marker && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-4 py-2 shadow-md backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-neutral-700">Tap the map to drop a pin</span>
            </div>
          </div>
        )}
      </div>

      {marker ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-medium text-emerald-700">
            {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
          </span>
          <button
            type="button"
            onClick={() => {
              setMarker(null);
              setQuery('');
            }}
            className="ml-auto text-xs text-emerald-600 underline hover:text-emerald-800 transition"
          >
            Clear
          </button>
        </div>
      ) : (
        <p className="text-xs text-neutral-500 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-neutral-400" />
          Search for an address above, tap the map, or use your current location.
        </p>
      )}
    </div>
  );
}
