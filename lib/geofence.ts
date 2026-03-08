// @/lib/geofence.ts

// Replace these with the actual latitudes and longitudes of your sites
export const SITE_COORDINATES = {
  GHCL: { lat: 20.848214, lng: 70.468189 },
  kajli: { lat: 20.894496, lng: 70.418492 },
  Nagaur: { lat: 27.2904094, lng: 73.8477851 },
};

export const MAX_ALLOWED_DISTANCE_METERS = 200;

// The Haversine formula to calculate distance between two lat/lng points in meters
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3; // Earth's radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const deltaP = p2 - p1;
  const deltaLon = lon2 - lon1;
  const deltaLambda = (deltaLon * Math.PI) / 180;

  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) *
      Math.cos(p2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
