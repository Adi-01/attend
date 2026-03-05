// constants/locations.ts

// 1. Define the runtime array for your UI
export const WORK_LOCATIONS = ["GHCL", "kajli", "Nagaur"] as const;

// 2. Derive the TypeScript type from the array
export type WorkLocation = (typeof WORK_LOCATIONS)[number];
