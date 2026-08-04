import { UserCheck, Shield, Award, Heart, Car, Phone, Star, MapPin, type LucideIcon } from 'lucide-react';

// Small icon set scoped to the Multi-Day Rental Safety Promise section.
// Mirrors the shape/values of TrustSectionForm.tsx's ICON_OPTIONS rather
// than sharing them directly, to keep this feature's change isolated.
export const SAFETY_ICON_OPTIONS = [
  { value: 'user-check', label: 'Verified / Checkmark' },
  { value: 'shield', label: 'Shield' },
  { value: 'award', label: 'Award' },
  { value: 'heart', label: 'Heart' },
  { value: 'car', label: 'Car' },
  { value: 'phone', label: 'Phone' },
  { value: 'star', label: 'Star' },
  { value: 'map-pin', label: 'Map Pin' },
];

export const SAFETY_ICON_MAP: Record<string, LucideIcon> = {
  'user-check': UserCheck,
  shield: Shield,
  award: Award,
  heart: Heart,
  car: Car,
  phone: Phone,
  star: Star,
  'map-pin': MapPin,
};
