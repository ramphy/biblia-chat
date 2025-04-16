// Removed "use client"; - This is now a Server Component

import { useTranslation } from '../i18n'; // Adjust path as needed
import HeroSectionOne from '@/app/components/hero-section-one'; // Import the new component path
// Removed TFunction import as we are passing strings now

interface PageProps {
  params: {
    lng: string;
  };
}

export default async function Home({ params }: PageProps) { // Made async
  const { lng } = await params; // Re-added await for params
  // Fetch translation function in the Server Component
  const { t } = await useTranslation(lng, 'common');

  // Get specific translations
  const heroTitle = t('heroTitle');
  const heroSubtitle = t('heroSubtitle');

  return (
    <>
      {/* Render the Client Component, passing the translated strings */}
      <HeroSectionOne heroTitle={heroTitle} heroSubtitle={heroSubtitle} />
    </>
  );
}

// Removed HeroSectionOne definition from this file
