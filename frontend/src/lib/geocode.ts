/**
 * Reverse geocode lat/lng to a human-readable city name.
 * Uses OpenStreetMap Nominatim (free, no API key required).
 */

const cache: Record<string, string> = {};

export async function getCityName(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (cache[key]) return cache[key];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.suburb ||
      data.address?.county ||
      'Unknown location';
    cache[key] = city;
    return city;
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}
