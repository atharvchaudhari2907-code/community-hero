'use client'
import { useState, useCallback } from 'react'

export interface GeolocationState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  address: string
  shortAddress: string
  error: string | null
  isLoading: boolean
  isGranted: boolean
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

async function reverseGeocode(lat: number, lng: number): Promise<{ full: string; short: string }> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const a = data.address || {}
    const suburb = a.suburb || a.neighbourhood || a.village || a.town || ''
    const city = a.city || a.state_district || a.county || ''
    const state = a.state || ''
    const short = suburb ? `${suburb}, ${city}` : `${city}, ${state}`
    return { full: data.display_name || short || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, short: short || 'Your location' }
  } catch {
    return { full: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, short: 'Your location' }
  }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null, lng: null, accuracy: null,
    address: '', shortAddress: '',
    error: null, isLoading: false, isGranted: false,
  })

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser.' }))
      return
    }
    setState((s) => ({ ...s, isLoading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords
        const { full, short } = await reverseGeocode(lat, lng)
        setState({
          lat, lng, accuracy,
          address: full,
          shortAddress: short,
          error: null,
          isLoading: false,
          isGranted: true,
        })
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied. Please allow location access in your browser settings.',
          2: 'GPS signal unavailable. Please check your device settings.',
          3: 'Location request timed out. Please try again.',
        }
        setState((s) => ({
          ...s,
          error: messages[err.code] || 'Failed to get location.',
          isLoading: false,
          isGranted: false,
        }))
      },
      { enableHighAccuracy: true, timeout: 14000, maximumAge: 0 }
    )
  }, [])

  return { ...state, requestLocation }
}
