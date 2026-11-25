import { Course } from '../../types';
import { getBundleConfigById } from '../../data/bundleCoursesMap';

export const ALLOWED_CHECKOUT_SCHEMES = new Set([
  'bkash',
  'nagad',
  'upay',
  'rocket',
  'tel',
  'mailto',
]);

export const TRUSTED_CHECKOUT_HOSTS = [
  'thrivingskill.com',
  'sslcommerz.com',
  'bkash.com',
  'nagad.com.bd',
  'shurjopay.com.bd',
  'aamarpay.com',
];

export interface ServerBundleCourseItem {
  id: string;
  title: string;
  priceBdt?: number;
}

export interface ServerProductData {
  id: string;
  priceBdt?: number;
  originalPriceBdt?: number;
  discountPercent?: number;
  bundledCourseIds?: string[];
  bundledCourses?: ServerBundleCourseItem[];
}

export interface ResolvedCheckoutPricing {
  isBundle: boolean;
  priceBdt: number;
  subtotalBdt: number;
  discountBdt: number;
  discountPercent: number;
  subCourses: ServerBundleCourseItem[];
}

export type NavigationDecision =
  | { action: 'allow' }
  | { action: 'open_external'; url: string }
  | { action: 'block' };

/**
 * Normalizes a site URL and returns its hostname safely.
 */
function parseUrlSafe(rawUrl?: string | null): URL | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    return new URL(rawUrl.trim());
  } catch {
    return null;
  }
}

/**
 * Checks whether a hostname belongs to Thriving Skills or an approved payment gateway.
 */
export function isTrustedCheckoutHost(hostname: string, activeSiteUrl: string = 'https://thrivingskill.com'): boolean {
  const cleanHost = hostname.toLowerCase();
  if (!cleanHost) return false;

  const siteParsed = parseUrlSafe(activeSiteUrl);
  const allowedHosts = new Set(TRUSTED_CHECKOUT_HOSTS);
  if (siteParsed?.hostname) {
    allowedHosts.add(siteParsed.hostname.toLowerCase());
  }

  for (const trusted of allowedHosts) {
    if (cleanHost === trusted || cleanHost.endsWith(`.${trusted}`)) {
      return true;
    }
  }
  return false;
}

/**
 * Verifies that a URL (e.g., WebView onMessage source URL) strictly matches the expected HTTPS checkout site origin.
 */
export function isTrustedCheckoutOrigin(
  url?: string | null,
  activeSiteUrl: string = 'https://thrivingskill.com'
): boolean {
  const parsed = parseUrlSafe(url);
  const expected = parseUrlSafe(activeSiteUrl) || parseUrlSafe('https://thrivingskill.com');
  if (!parsed || !expected) return false;
  if (parsed.protocol !== 'https:') return false;

  const actualHost = parsed.hostname.toLowerCase();
  const expectedHost = expected.hostname.toLowerCase();
  return actualHost === expectedHost || actualHost.endsWith(`.${expectedHost}`);
}

/**
 * Builds the strict WebView originWhitelist covering the active site and trusted gateway domains.
 */
export function getCheckoutOriginWhitelist(activeSiteUrl: string = 'https://thrivingskill.com'): string[] {
  const whitelist = new Set<string>([
    'https://thrivingskill.com',
    'https://*.thrivingskill.com',
    'https://sslcommerz.com',
    'https://*.sslcommerz.com',
    'https://bkash.com',
    'https://*.bkash.com',
    'https://nagad.com.bd',
    'https://*.nagad.com.bd',
    'https://shurjopay.com.bd',
    'https://*.shurjopay.com.bd',
    'https://aamarpay.com',
    'https://*.aamarpay.com',
  ]);

  const parsedSite = parseUrlSafe(activeSiteUrl);
  if (parsedSite && parsedSite.protocol === 'https:') {
    whitelist.add(`https://${parsedSite.hostname}`);
  }

  return Array.from(whitelist);
}

/**
 * Validates WebView navigation requests and custom app URL schemes strictly against allowlists.
 * Blocks unknown URL schemes and untrusted hosts.
 */
export function evaluateCheckoutNavigationRequest(
  rawUrl: string,
  activeSiteUrl: string = 'https://thrivingskill.com'
): NavigationDecision {
  const url = (rawUrl || '').trim();
  if (!url) return { action: 'block' };

  if (url.startsWith('http://')) {
    return { action: 'block' };
  }

  if (url.startsWith('https://')) {
    const parsed = parseUrlSafe(url);
    if (!parsed) return { action: 'block' };
    return isTrustedCheckoutHost(parsed.hostname, activeSiteUrl)
      ? { action: 'allow' }
      : { action: 'block' };
  }

  // Extract custom URL scheme (e.g., bkash://, nagad://, tel:, mailto:, intent://)
  const schemeMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!schemeMatch) {
    return { action: 'block' };
  }
  const scheme = schemeMatch[1].toLowerCase();

  if (ALLOWED_CHECKOUT_SCHEMES.has(scheme)) {
    return { action: 'open_external', url };
  }

  if (scheme === 'intent') {
    const fallbackMatch = url.match(/browser_fallback_url=([^;&]+)/);
    if (fallbackMatch && fallbackMatch[1]) {
      try {
        const decodedFallback = decodeURIComponent(fallbackMatch[1]);
        const parsedFallback = parseUrlSafe(decodedFallback);
        if (
          parsedFallback &&
          parsedFallback.protocol === 'https:' &&
          isTrustedCheckoutHost(parsedFallback.hostname, activeSiteUrl)
        ) {
          return { action: 'open_external', url: decodedFallback };
        }
      } catch {
        return { action: 'block' };
      }
    }
  }

  return { action: 'block' };
}

/**
 * Detects WooCommerce / gateway order completion redirect URLs from trusted checkout origins.
 */
export function isOrderCompletionUrl(
  rawUrl: string,
  activeSiteUrl: string = 'https://thrivingskill.com'
): boolean {
  if (!rawUrl || !isTrustedCheckoutOrigin(rawUrl, activeSiteUrl)) {
    return false;
  }
  return (
    rawUrl.includes('order-received') ||
    rawUrl.includes('thank-you') ||
    rawUrl.includes('checkout/success') ||
    (rawUrl.includes('key=wc_order_') && !rawUrl.includes('order-pay'))
  );
}

/**
 * Detects intermediate WooCommerce cart redirects on the checkout domain.
 */
export function isCartRedirectUrl(
  rawUrl: string,
  activeSiteUrl: string = 'https://thrivingskill.com'
): boolean {
  if (!rawUrl || !isTrustedCheckoutOrigin(rawUrl, activeSiteUrl)) {
    return false;
  }
  const parsed = parseUrlSafe(rawUrl);
  if (!parsed) return false;
  return parsed.pathname.includes('/cart') && !rawUrl.includes('checkout');
}

/**
 * Resolves checkout pricing and bundle breakdown strictly from server product/course data (matched by ID),
 * without hard-coded USD*120 multipliers or title-based bundle guessing.
 */
export function resolveServerCheckoutPricingAndBundle(
  course: Course,
  serverProduct?: ServerProductData | null,
  catalogCourses: Course[] = []
): ResolvedCheckoutPricing {
  const courseIdStr = String(course.id);

  // Price comes strictly from server BDT value
  const priceBdt =
    serverProduct?.priceBdt !== undefined
      ? serverProduct.priceBdt
      : typeof course.priceBdt === 'number'
      ? course.priceBdt
      : 0;

  // Resolve bundled courses strictly by ID from server payload first, then course object, then ID-keyed map
  let subCourses: ServerBundleCourseItem[] = [];
  let discountPercent = serverProduct?.discountPercent ?? course.bundleDiscountPercent ?? 0;

  if (serverProduct?.bundledCourses && serverProduct.bundledCourses.length > 0) {
    subCourses = serverProduct.bundledCourses.map((sub) => ({
      id: String(sub.id),
      title: sub.title,
      priceBdt: sub.priceBdt,
    }));
  } else if (serverProduct?.bundledCourseIds && serverProduct.bundledCourseIds.length > 0) {
    subCourses = serverProduct.bundledCourseIds.map((subId) => {
      const matched = catalogCourses.find((c) => String(c.id) === String(subId));
      return {
        id: String(subId),
        title: matched?.title || `Course #${subId}`,
        priceBdt: matched?.priceBdt,
      };
    });
  } else if (course.bundleCourses && course.bundleCourses.length > 0) {
    subCourses = course.bundleCourses.map((sub) => ({
      id: String(sub.id),
      title: sub.title,
      priceBdt: sub.priceBdt,
    }));
  } else {
    const fallbackById = getBundleConfigById(courseIdStr);
    if (fallbackById) {
      subCourses = fallbackById.subCourses.map((sub) => ({
        id: String(sub.id),
        title: sub.title,
        priceBdt: sub.priceBdt,
      }));
      if (!discountPercent) {
        discountPercent = fallbackById.discountPercent;
      }
    }
  }

  const isBundle = subCourses.length > 0;
  const sumOfSubCourses = subCourses.reduce((acc, c) => acc + (c.priceBdt || 0), 0);

  const subtotalBdt =
    serverProduct?.originalPriceBdt && serverProduct.originalPriceBdt > priceBdt
      ? serverProduct.originalPriceBdt
      : isBundle && sumOfSubCourses > priceBdt
      ? sumOfSubCourses
      : typeof course.originalPriceBdt === 'number' && course.originalPriceBdt > priceBdt
      ? course.originalPriceBdt
      : priceBdt;

  const discountBdt = Math.max(0, subtotalBdt - priceBdt);
  if (!discountPercent && subtotalBdt > 0 && discountBdt > 0) {
    discountPercent = Math.round((discountBdt / subtotalBdt) * 100);
  }

  return {
    isBundle,
    priceBdt,
    subtotalBdt,
    discountBdt,
    discountPercent,
    subCourses,
  };
}
