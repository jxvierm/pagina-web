export const VEHICLE_BRANDS = [
  'No aplica',
  'Kenworth',
  'International',
  'Freightliner',
  'Chevrolet',
  'Hino',
  'Foton',
  'Mack',
  'Volvo',
  'Scania',
  'Mercedes-Benz',
  'JAC',
  'Isuzu',
  'Ford',
  'Dongfeng',
  'FAW',
  'Otro',
] as const;

export type VehicleBrand = (typeof VEHICLE_BRANDS)[number];

export function isNoAplicaVehicle(v?: string | null): boolean {
  if (!v) return false;
  const lower = v.trim().toLowerCase();
  return lower === 'no aplica' || lower === 'n/a' || lower === 'no-aplica';
}
