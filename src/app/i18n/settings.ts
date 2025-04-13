export const fallbackLng = 'en';
export const languages = [fallbackLng, 'es']; // Add other languages from your config here
export const defaultNS = 'common';
export const cookieName = 'i18next';

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true, // Set to true for debugging
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
