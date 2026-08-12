/**
 * JSON-LD Structured Data Schemas for SEO
 * Generates schema.org markup for rich snippets in search results
 */

import { SITE_URL } from '@/lib/siteUrl';

interface LocalBusinessSchema {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness';
  '@id': string;
  name: string;
  description: string;
  url: string;
  telephone: string;
  priceRange: string;
  address: {
    '@type': 'PostalAddress';
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  geo: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHours: string[];
  sameAs: string[];
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
  };
}

interface TouristTripSchema {
  '@context': 'https://schema.org';
  '@type': 'TouristTrip';
  name: string;
  description: string;
  url: string;
  image?: string;
  itinerary?: {
    '@type': 'ItemList';
    itemListElement: Array<{
      '@type': 'ListItem';
      position: number;
      name: string;
      description: string;
    }>;
  };
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  url: string;
  image?: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
  };
}

export function generateLocalBusinessSchema(): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#organization`,
    name: 'Nainital Taxi',
    description: 'Premium taxi and tour services in Nainital, Uttarakhand. Book reliable transfers and tour packages.',
    url: SITE_URL,
    telephone: '+918445206116',
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nainital',
      addressRegion: 'Uttarakhand',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 29.3919,
      longitude: 79.4542,
    },
    openingHours: ['Mo-Su 00:00-23:59'],
    sameAs: [
      // Add social media links here when available
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '500',
    },
  };
}

export function generateTouristTripSchema(trip: {
  name: string;
  description: string;
  url: string;
  image?: string;
  itinerary?: Array<{ name: string; description: string }>;
  price?: number;
}): TouristTripSchema {
  const schema: TouristTripSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: trip.name,
    description: trip.description,
    url: trip.url,
  };

  if (trip.image) {
    schema.image = trip.image;
  }

  if (trip.itinerary && trip.itinerary.length > 0) {
    schema.itinerary = {
      '@type': 'ItemList',
      itemListElement: trip.itinerary.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        description: item.description,
      })),
    };
  }

  if (trip.price) {
    schema.offers = {
      '@type': 'Offer',
      price: trip.price.toString(),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    };
  }

  return schema;
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  url: string;
  image?: string;
  price: number;
  rating?: { value: number; count: number };
}): ProductSchema {
  const schema: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    url: product.url,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  };

  if (product.image) {
    schema.image = product.image;
  }

  if (product.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.value.toString(),
      reviewCount: product.rating.count.toString(),
    };
  }

  return schema;
}

/**
 * Component to render JSON-LD script tag
 */
export function StructuredDataScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
