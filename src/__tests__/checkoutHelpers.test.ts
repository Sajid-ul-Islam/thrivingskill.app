import {
  evaluateCheckoutNavigationRequest,
  getCheckoutOriginWhitelist,
  isOrderCompletionUrl,
  isTrustedCheckoutOrigin,
  resolveServerCheckoutPricingAndBundle,
} from '../services/checkout/checkoutHelpers';
import { getBundleConfigById } from '../data/bundleCoursesMap';
import { Course } from '../types';

const makeCourse = (overrides: Partial<Course> = {}): Course => ({
  id: '88180',
  title: 'AI Course Bundle Without ID', // deliberately mentions "Bundle" to verify title matching is disabled
  slug: 'ai-course',
  subtitle: 'Subtitle',
  description: 'Desc',
  category: 'ai',
  instructor: {
    id: 'inst-1',
    name: 'Instructor',
    title: 'Lead Instructor',
    company: 'Thriving Skills',
    avatar: '',
    bio: 'Bio',
    rating: 4.8,
    studentsCount: 100,
    coursesCount: 3,
  },
  rating: 4.8,
  reviewsCount: 10,
  enrolledCount: 100,
  durationHours: 3,
  lecturesCount: 8,
  certificateIncluded: true,
  language: 'English',
  lastUpdated: '2026-01-01',
  level: 'Intermediate',
  price: 99, // Must never be multiplied by 120!
  originalPrice: 120,
  priceBdt: 1500,
  thumbnail: 'https://thrivingskill.com/thumb.jpg',
  highlights: [],
  prerequisites: [],
  modules: [],
  reviews: [],
  ...overrides,
});

describe('checkoutHelpers security & server pricing', () => {
  describe('evaluateCheckoutNavigationRequest (scheme & host allowlisting)', () => {
    it('allows HTTPS requests to active checkout and trusted gateway hosts', () => {
      expect(
        evaluateCheckoutNavigationRequest(
          'https://thrivingskill.com/checkout/',
          'https://thrivingskill.com'
        )
      ).toEqual({
        action: 'allow',
      });
      expect(
        evaluateCheckoutNavigationRequest(
          'https://sandbox.sslcommerz.com/pay',
          'https://thrivingskill.com'
        )
      ).toEqual({
        action: 'allow',
      });
      expect(
        evaluateCheckoutNavigationRequest(
          'https://staging.thrivingskill.com/checkout/',
          'https://staging.thrivingskill.com'
        )
      ).toEqual({
        action: 'allow',
      });
    });

    it('blocks cleartext http:// and untrusted https:// domains', () => {
      expect(evaluateCheckoutNavigationRequest('http://thrivingskill.com/checkout/')).toEqual({
        action: 'block',
      });
      expect(evaluateCheckoutNavigationRequest('https://evil.example.com/phish')).toEqual({
        action: 'block',
      });
    });

    it('allows only allowlisted non-HTTP payment/contact schemes', () => {
      for (const externalUrl of [
        'bkash://payment?id=1',
        'nagad://pay/123',
        'upay://checkout',
        'rocket://pay',
        'tel:+8801700000000',
        'mailto:support@thrivingskill.com',
      ]) {
        expect(evaluateCheckoutNavigationRequest(externalUrl)).toEqual({
          action: 'open_external',
          url: externalUrl,
        });
      }
    });

    it('blocks unknown custom URL schemes and malicious intent fallbacks', () => {
      expect(evaluateCheckoutNavigationRequest('javascript:alert(1)')).toEqual({ action: 'block' });
      expect(evaluateCheckoutNavigationRequest('file:///etc/passwd')).toEqual({ action: 'block' });
      expect(evaluateCheckoutNavigationRequest('whatsapp://send?text=hi')).toEqual({
        action: 'block',
      });
      expect(evaluateCheckoutNavigationRequest('fb://profile/1')).toEqual({ action: 'block' });
      expect(
        evaluateCheckoutNavigationRequest(
          'intent://pay#Intent;S.browser_fallback_url=https%3A%2F%2Fevil.com%2Fsteal;end'
        )
      ).toEqual({ action: 'block' });
      expect(
        evaluateCheckoutNavigationRequest(
          'intent://pay#Intent;S.browser_fallback_url=https%3A%2F%2Fsecurepay.sslcommerz.com%2Fgw;end'
        )
      ).toEqual({ action: 'open_external', url: 'https://securepay.sslcommerz.com/gw' });
    });
  });

  describe('origin checks & originWhitelist', () => {
    it('does not include wildcard https://* or staging in production originWhitelist', () => {
      const prodWhitelist = getCheckoutOriginWhitelist('https://thrivingskill.com');
      expect(prodWhitelist).not.toContain('https://*');
      expect(prodWhitelist).not.toContain('https://*.thrivingskill.com');
      expect(prodWhitelist).not.toContain('https://staging.thrivingskill.com');
      expect(prodWhitelist).toContain('https://thrivingskill.com');
      expect(prodWhitelist).toContain('https://www.thrivingskill.com');
      expect(prodWhitelist).toContain('https://*.sslcommerz.com');

      const stagingWhitelist = getCheckoutOriginWhitelist('https://staging.thrivingskill.com');
      expect(stagingWhitelist).toContain('https://staging.thrivingskill.com');
      expect(stagingWhitelist).not.toContain('https://thrivingskill.com');
    });

    it('validates message origin strictly against active HTTPS site origin', () => {
      expect(
        isTrustedCheckoutOrigin('https://thrivingskill.com/checkout/', 'https://thrivingskill.com')
      ).toBe(true);
      expect(
        isTrustedCheckoutOrigin('https://evil.com/checkout/', 'https://thrivingskill.com')
      ).toBe(false);
      expect(
        isTrustedCheckoutOrigin('http://thrivingskill.com/checkout/', 'https://thrivingskill.com')
      ).toBe(false);
      expect(isTrustedCheckoutOrigin(undefined, 'https://thrivingskill.com')).toBe(false);
    });

    it('detects completion redirects only on trusted checkout origin', () => {
      expect(
        isOrderCompletionUrl(
          'https://thrivingskill.com/checkout/order-received/123/?key=wc_order_abc'
        )
      ).toBe(true);
      expect(isOrderCompletionUrl('https://evil.com/checkout/order-received/123/')).toBe(false);
      expect(
        isOrderCompletionUrl('https://thrivingskill.com/checkout/order-pay/123/?key=wc_order_abc')
      ).toBe(false);
    });
  });

  describe('resolveServerCheckoutPricingAndBundle (no USD*120, strict ID matching)', () => {
    it('uses server BDT price and bundledCourseIds matched by ID, never USD*120 or title guessing', () => {
      const catalog: Course[] = [
        makeCourse({ id: '101', title: 'Excel Course', priceBdt: 1200 }),
        makeCourse({ id: '102', title: 'Power BI Course', priceBdt: 1500 }),
      ];

      const resolved = resolveServerCheckoutPricingAndBundle(
        makeCourse({ id: '99999', title: 'Mystery Bundle Course', price: 50, priceBdt: undefined }),
        {
          id: '99999',
          priceBdt: 1800,
          bundledCourseIds: ['101', '102'],
        },
        catalog
      );

      expect(resolved.isBundle).toBe(true);
      expect(resolved.priceBdt).toBe(1800);
      expect(resolved.subtotalBdt).toBe(2700);
      expect(resolved.discountBdt).toBe(900);
      expect(resolved.discountPercent).toBe(33);
      expect(resolved.subCourses.map((c) => c.id)).toEqual(['101', '102']);
    });

    it('does not treat an unmapped course with "Bundle" in its title as a hardcoded bundle', () => {
      expect(getBundleConfigById('unknown-bundle-id')).toBeNull();
      const resolved = resolveServerCheckoutPricingAndBundle(
        makeCourse({ id: '777777', title: 'Special Bundle Offer', price: 100, priceBdt: 950 }),
        null,
        []
      );

      expect(resolved.isBundle).toBe(false);
      expect(resolved.priceBdt).toBe(950);
      expect(resolved.priceBdt).not.toBe(12000);
    });
  });
});
