import { NextRequest, NextResponse } from 'next/server';
import acceptLanguage from 'accept-language';
import { fallbackLng, languages, cookieName } from './app/i18n/settings'; // Adjusted path relative to src

acceptLanguage.languages(languages);

export const config = {
  // matcher: '/:lng*'
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};

export function middleware(req: NextRequest) {
  // Add a console log to confirm execution
  console.log('Middleware executing for path:', req.nextUrl.pathname);

  let lng: string | null | undefined;
  if (req.cookies.has(cookieName))
    lng = acceptLanguage.get(req.cookies.get(cookieName)?.value);
  if (!lng) lng = acceptLanguage.get(req.headers.get('Accept-Language'));
  if (!lng) lng = fallbackLng;

  const pathname = req.nextUrl.pathname;

  // Define default Bible versions per language
  const defaultBibleVersions: { [key: string]: string } = {
    en: 'NIV',
    es: 'RVR1960',
    // Add other languages and their default versions here if needed
  };

  // Check for /[lng]/bible/ path for redirection
  const bibleBasePathRegex = /^\/([a-z]{2})\/bible\/?$/; // Matches /en/bible or /es/bible/
  const bibleMatch = pathname.match(bibleBasePathRegex);

  if (bibleMatch) {
    const langFromPath = bibleMatch[1];
    const defaultVersion = defaultBibleVersions[langFromPath];
    if (defaultVersion) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = `/${langFromPath}/bible/${defaultVersion}/GEN/1`;
      console.log(`Redirecting ${pathname} to ${redirectUrl.pathname}`);
      return NextResponse.redirect(redirectUrl);
    } else {
      // Optional: Handle case where language exists but no default version is defined
      console.warn(`No default Bible version defined for language: ${langFromPath}`);
    }
  }

  // Explicitly check for the root path and redirect
  if (pathname === '/') {
    console.log(`Redirecting root path to /${lng}`);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/${lng}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Check if other paths are missing the language prefix
  const pathnameIsMissingLocale = languages.every(
    (loc) => !pathname.startsWith(`/${loc}/`) && pathname !== `/${loc}`
  );

  // Redirect if locale is missing for non-root paths, excluding internal/API/file paths
  // Exclude API routes, static assets, images, favicon, etc. (Root path '/' is already handled)
  if (
    pathnameIsMissingLocale &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.includes('.') // Simple check to exclude files like favicon.ico, image.png etc.
  ) {
    console.log(`Redirecting missing locale path ${pathname} to /${lng}${pathname}`);
    // Construct the new URL using clone() for potentially better reliability
    const redirectUrl = req.nextUrl.clone();
    // No need for the ternary operator here as '/' is handled above
    redirectUrl.pathname = `/${lng}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Handle setting language cookie based on referer (if applicable)
  // This should run *after* the potential redirect
  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer')!);
    const lngInReferer = languages.find((l: string) =>
      refererUrl.pathname.startsWith(`/${l}`)
    );
    const response = NextResponse.next();
    if (lngInReferer) {
      console.log(`Setting language cookie to ${lngInReferer} based on referer`);
      response.cookies.set(cookieName, lngInReferer);
    }
    return response;
  }

  console.log('Middleware proceeding without redirect/cookie set.');
  return NextResponse.next();
}
