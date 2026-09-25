import { SiteConfig, SiteLocationConfig } from '@/types';

export const DEFAULT_LOCATION: SiteLocationConfig = {
  city: 'Bengaluru',
  altCity: 'Bangalore',
  state: 'Karnataka',
  country: 'India',
  serviceArea: 'Serving Bengaluru and nearby areas',
  serviceAreaLabel: 'Serving Bengaluru and nearby areas',
  serviceAvailability: 'Accepting Mehndi Bookings across Bengaluru • WhatsApp Only',
  availability: 'Accepting Mehndi Bookings across Bengaluru • WhatsApp Only',
  address: 'Sadashivanagar / Indiranagar, Bengaluru',
  googleMapsUrl: '',
  operatingHours: 'Mon – Sun: 10:00 AM – 8:00 PM',
  businessHours: 'Mon – Sun: 10:00 AM – 8:00 PM',
  logoUrl: '/images/logo.png',
  faviconUrl: '/favicon.ico',
};

/**
 * Returns normalized location tokens for the site.
 * Supports dynamic configuration from Admin Panel while safely falling back to defaults.
 */
export function getLocationTokens(settings?: SiteConfig | { location?: Partial<SiteLocationConfig> } | null): SiteLocationConfig {
  const loc = settings?.location;
  const city = loc?.city?.trim() || DEFAULT_LOCATION.city;
  const altCity = loc?.altCity?.trim() || DEFAULT_LOCATION.altCity;
  const state = loc?.state?.trim() || DEFAULT_LOCATION.state;
  const country = loc?.country?.trim() || DEFAULT_LOCATION.country;
  const serviceArea = loc?.serviceArea?.trim() || loc?.serviceAreaLabel?.trim() || `Serving ${city} and nearby areas`;
  const serviceAvailability =
    loc?.serviceAvailability?.trim() || loc?.availability?.trim() || `Accepting Mehndi Bookings across ${city} • WhatsApp Only`;
  const operatingHours = loc?.operatingHours?.trim() || loc?.businessHours?.trim() || DEFAULT_LOCATION.operatingHours;

  return {
    city,
    altCity,
    state,
    country,
    serviceArea,
    serviceAreaLabel: serviceArea,
    serviceAvailability,
    availability: serviceAvailability,
    address: loc?.address?.trim() || `${city}, ${state}`,
    googleMapsUrl: loc?.googleMapsUrl?.trim() || '',
    operatingHours,
    businessHours: operatingHours,
    logoUrl: loc?.logoUrl || '/images/logo.png',
    faviconUrl: loc?.faviconUrl || '/favicon.ico',
  };
}

/**
 * Safely interpolates location tokens into template strings.
 * Replaces {city}, {altCity}, {state}, {country}, {area}, and {availability}.
 */
export function formatLocation(
  template: string,
  settings?: SiteConfig | { location?: Partial<SiteLocationConfig> } | null
): string {
  if (!template) return '';
  const tokens = getLocationTokens(settings);

  return template
    .replace(/\{city\}/gi, tokens.city)
    .replace(/\{altCity\}/gi, tokens.altCity)
    .replace(/\{state\}/gi, tokens.state)
    .replace(/\{country\}/gi, tokens.country)
    .replace(/\{area\}/gi, tokens.serviceArea)
    .replace(/\{availability\}/gi, tokens.serviceAvailability);
}
