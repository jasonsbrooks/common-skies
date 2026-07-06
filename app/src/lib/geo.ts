/** Tiny locator-map geometry: 21 metro coordinates + a simplified lower-48
 * outline, projected with a flat equirectangular-with-lat-correction — fine
 * for an editorial locator, not for navigation. */

export const CITY_COORDS: Record<string, [number, number]> = {
  // city-name prefix -> [lat, lon]
  Atlanta: [33.75, -84.39],
  Boston: [42.36, -71.06],
  Charlotte: [35.23, -80.84],
  Chicago: [41.88, -87.63],
  "Dallas/Fort Worth": [32.9, -97.04],
  Denver: [39.74, -104.99],
  Houston: [29.76, -95.37],
  "Las Vegas": [36.17, -115.14],
  "Los Angeles": [34.05, -118.24],
  Miami: [25.76, -80.19],
  "New York City": [40.71, -74.01],
  Orlando: [28.54, -81.38],
  Phoenix: [33.45, -112.07],
  Portland: [45.52, -122.68],
  Sacramento: [38.58, -121.49],
  "San Diego": [32.72, -117.16],
  "San Francisco": [37.77, -122.42],
  Seattle: [47.61, -122.33],
  Tampa: [27.95, -82.46],
  Washington: [38.9, -77.04],
  "West Palm Beach/Palm Beach": [26.71, -80.05],
};

export const MAP_W = 300;
export const MAP_H = 168;

export function project(lat: number, lon: number): [number, number] {
  const x = ((lon + 125.5) / 59.5) * MAP_W;
  const y = ((49.8 - lat) / 26) * MAP_H;
  return [x, y];
}

/** Very simplified lower-48 outline, [lon, lat] pairs, clockwise from the
 * Pacific Northwest. Editorial silhouette only. */
const OUTLINE: [number, number][] = [
  [-124.7, 48.4], [-95.2, 49.0], [-94.8, 48.7], [-89.6, 47.9], [-84.8, 46.6],
  [-82.4, 45.3], [-82.2, 43.5], [-82.9, 42.1], [-78.9, 42.9], [-76.8, 43.5],
  [-74.9, 44.9], [-71.4, 45.1], [-69.1, 47.3], [-66.9, 44.8], [-70.1, 43.6],
  [-70.6, 41.7], [-74.0, 40.4], [-75.6, 38.4], [-75.9, 36.9], [-75.7, 35.2],
  [-78.6, 33.8], [-81.1, 31.9], [-80.1, 26.9], [-80.4, 25.2], [-81.7, 25.3],
  [-82.8, 27.7], [-84.1, 30.0], [-85.6, 30.0], [-89.2, 29.3], [-90.3, 29.1],
  [-93.9, 29.7], [-97.1, 27.8], [-97.3, 25.9], [-99.4, 27.6], [-101.5, 29.8],
  [-103.2, 29.0], [-104.9, 30.6], [-106.5, 31.8], [-111.0, 31.3], [-114.9, 32.6],
  [-117.2, 32.6], [-118.5, 34.0], [-120.7, 34.5], [-122.0, 36.7], [-123.8, 38.9],
  [-124.5, 40.5], [-124.2, 43.5], [-124.1, 46.2],
];

export function usOutlinePath(): string {
  return (
    OUTLINE.map(([lon, lat], i) => {
      const [x, y] = project(lat, lon);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join("") + "Z"
  );
}

export function cityPoint(cityName: string): [number, number] | null {
  const key = Object.keys(CITY_COORDS).find((k) => cityName.startsWith(k));
  if (!key) return null;
  const [lat, lon] = CITY_COORDS[key]!;
  return project(lat, lon);
}
