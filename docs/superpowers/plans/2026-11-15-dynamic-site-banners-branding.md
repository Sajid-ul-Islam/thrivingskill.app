# Dynamic Site Banners & Branding Auto-Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, offline-first auto-synchronization system that periodically and on-launch fetches live banners, promotional imagery, and site taglines from the WordPress backend (`https://thrivingskill.com/wp-json`) without requiring any API keys, seamlessly updating the mobile app's hero carousel and brand drawers.

**Architecture:** A dedicated `BrandingService` communicates with public WordPress Core and LearnPress REST endpoints (`/wp-json`, `/wp/v2/lp_collection?_embed`, `/wp/v2/posts?_embed`). Results are cached persistently using `CacheManager` (Stale-While-Revalidate with 1-hour TTL). The data is exposed via `LearningContext` and rendered in an upgraded `HeroCarousel` with responsive remote image backdrops, WCAG AA compliant gradient readability overlays, and automatic fallback to curated offline slides.

**Tech Stack:** React Native, TypeScript, WordPress REST API v2, LearnPress v1, Expo LinearGradient, AsyncStorage (`CacheManager`).

**Spec:** User request to inspect `thrivingskill.com` and automatically fetch updated banners, images, and taglines from the site backend server.

## Global Constraints

- **Zero API Keys Required**: All endpoints queried (`/wp-json`, `/wp/v2/lp_collection`, `/wp/v2/posts`, `/wp/v2/media`) are completely public standard WordPress REST endpoints.
- **Rule 1: Non-Negotiable Type Safety**: `npm run typecheck` must exit with code 0 after every task.
- **Rule 2: Strict Brand Identity**: Adhere to official Thriving Skills color tokens (`#102F53`, `#FFB606`, `#E34234`, `#0F192C`/`#1E293B`, `#FFFFFF`/`#F8FAFC`).
- **Rule 3: Timer Hygiene**: Use `ReturnType<typeof setTimeout>` and clean up in unmount teardowns.
- **Rule 4: Windows PowerShell Syntax Safety**: Write verification scripts to `scripts/` and run via `node scripts/<script>.js`.
- **Option A Reader-App Compliance**: Banners and taglines must not introduce direct checkout links or in-app prices.

## Review Focus

1. **Network Offline / Server Unreachable**: When the device is offline or the WordPress server is slow/unreachable, the app must immediately render cached slides or default curated slides without showing empty cards or spinners.
2. **Broken or Missing Media URLs**: If a remote image fails to load or has invalid headers, `HeroCarousel` must smoothly fall back to the gradient theme background without broken image placeholders.
3. **HTML Entities in Titles/Excerpts**: WordPress REST titles often contain HTML entities like `&#8211;`, `&amp;`, or `<p>`. All text must be sanitized before rendering.
4. **WCAG AA Text Contrast over Dynamic Images**: Remote images can have variable contrast; an overlaid directional gradient mask (`rgba(16, 47, 83, 0.4)` to `rgba(16, 47, 83, 0.95)`) is mandatory to guarantee readable white text.
5. **Memory & Stale Cache Leaks**: Caching must be keyed and bounded by TTL so memory and AsyncStorage do not grow indefinitely.

---

### Task 1: Create `BrandingService` for WordPress REST Integration

**Files:**
- Create: `src/services/api/brandingService.ts`
- Test: `scripts/test_branding_service.js`

**Interfaces:**
- Produces:
  ```ts
  export interface SiteBrandingInfo {
    siteName: string;
    tagline: string;
    taglineBn: string;
    siteUrl: string;
    updatedAt: number;
  }

  export interface DynamicCarouselSlide extends CarouselSlide {
    imageUrl?: string;
    linkUrl?: string;
  }

  export class BrandingService {
    static getSiteBranding(forceRefresh?: boolean): Promise<SiteBrandingInfo>;
    static getDynamicBanners(forceRefresh?: boolean): Promise<DynamicCarouselSlide[]>;
  }
  ```

- [ ] **Step 1: Write test verification script `scripts/test_branding_service.js`**
  Write a script that calls `BrandingService.getSiteBranding()` and `BrandingService.getDynamicBanners()`, asserting:
  - `siteName` is `'Thrivingskills'`
  - `tagline` includes `'Empowering People'`
  - `banners` returns at least 3 slides with valid `id`, `title`, `badge`, and `ctaText`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `node scripts/test_branding_service.js`
  Expected: FAIL with module not found or method missing.
- [ ] **Step 3: Implement `src/services/api/brandingService.ts`**
  - Implement `getSiteBranding`: fetch `/wp-json` via `HttpClient.get('/')`. Extract `name`, `description`. Cache with key `site_branding_meta`.
  - Implement `getDynamicBanners`: fetch `/wp/v2/lp_collection?_embed` and `/wp/v2/posts?_embed` and fallback to curated slides. Extract featured media URLs.
  - Sanitize all strings with regex/entity decoders.
- [ ] **Step 4: Run test to verify it passes**
  Run: `node scripts/test_branding_service.js`
  Expected: PASS with live data and fallback assertion.
- [ ] **Step 5: Verify types**
  Run: `npm run typecheck`
  Expected: 0 errors.

---

### Task 2: Expose Dynamic Branding & Banners in `LearningContext`

**Files:**
- Modify: `src/context/LearningContext.tsx`
- Modify: `src/services/api/index.ts`

**Interfaces:**
- Consumes: `BrandingService.getSiteBranding()`, `BrandingService.getDynamicBanners()`
- Produces: `siteBranding: SiteBrandingInfo | null`, `banners: DynamicCarouselSlide[]`, `refreshBranding(force?: boolean): Promise<void>`

- [ ] **Step 1: Add branding state and refresh functions to `LearningContext`**
  - Add `siteBranding` and `banners` state, initialized with offline curated defaults.
  - In `useEffect` on startup, call `refreshBranding(false)` (Stale-While-Revalidate).
  - Provide `refreshBranding(true)` for pull-to-refresh on `HomeScreen`.
- [ ] **Step 2: Export `BrandingService` from `src/services/api/index.ts`**
- [ ] **Step 3: Run typecheck to verify interface conformity**
  Run: `npm run typecheck`
  Expected: 0 errors.

---

### Task 3: Upgrade `HeroCarousel.tsx` to Render Remote Banner Imagery with Gradient Overlay

**Files:**
- Modify: `src/components/common/HeroCarousel.tsx`

**Interfaces:**
- Consumes: `DynamicCarouselSlide[]` (with optional `imageUrl`)
- Supports: `slides?: DynamicCarouselSlide[]` prop (defaults to dynamic banners from `useLearning()`)

- [ ] **Step 1: Update `CarouselSlide` interface in `HeroCarousel.tsx`**
  - Add optional `imageUrl?: string` and `linkUrl?: string`.
- [ ] **Step 2: Implement image backdrop with linear gradient readability overlay**
  - When `item.imageUrl` is present, render `Image` with `absoluteFillObject` behind the `LinearGradient`.
  - Gradient uses dark overlay colors (`rgba(16, 47, 83, 0.45)` to `rgba(16, 47, 83, 0.95)`) ensuring WCAG AA contrast for text.
  - Gracefully handles image load errors via `onError={() => setImageError(true)}`.
- [ ] **Step 3: Ensure dynamic slide count pagination**
  - Update pagination dots and slide counter (`${activeIndex + 1}/${slides.length}`).
- [ ] **Step 4: Run typecheck**
  Run: `npm run typecheck`
  Expected: 0 errors.

---

### Task 4: Wire Dynamic Taglines into `BrandDrawer.tsx` and `HomeScreen.tsx`

**Files:**
- Modify: `src/components/common/BrandDrawer.tsx`
- Modify: `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `siteBranding` from `useLearning()` and `isBangla` from `useTranslation()`

- [ ] **Step 1: Update `BrandDrawer.tsx` brand slogan**
  - Replace static `'Upskill. Elevate. Thrive.'` with dynamic `siteBranding?.tagline` (with bilingual fallback).
- [ ] **Step 2: Update `HomeScreen.tsx` pull-to-refresh & slide pass-through**
  - In `onRefresh`, include `refreshBranding(true)`.
  - Pass dynamic `banners` from `useLearning()` into `<HeroCarousel />`.
  - Handle banner clicks: if `actionType === 'course'`, navigate to course; if `trailer`, open trailer; if `summit`, open summit; if `bundle`, navigate to bundle / courses.
- [ ] **Step 3: Run typecheck**
  Run: `npm run typecheck`
  Expected: 0 errors.

---

### Task 5: End-to-End Verification & Quality Audit

**Files:**
- Audit: All modified files

- [ ] **Step 1: Run TypeScript compiler check**
  Run: `npm run typecheck`
  Expected: 0 errors.
- [ ] **Step 2: Run layout and safe area audit**
  Run: `node scripts/verify_layout_and_safe_areas.js`
  Expected: 30/30 screens pass.
- [ ] **Step 3: Run WCAG contrast audit**
  Run: `node scripts/verify_wcag_contrast.js`
  Expected: 26/26 themes pass with 0 warnings.
- [ ] **Step 4: Run full app integrity audit**
  Run: `node scripts/audit_app.js`
  Expected: Clean audit with 0 broken imports, 0 unhandled timers, 0 missing styles.
- [ ] **Step 5: Git commit**
  Commit changes with clear conventional commit message.
