const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('--- Step 1: Checking brandingService.ts exists ---');
  const servicePath = path.resolve(__dirname, '../src/services/api/brandingService.ts');
  if (!fs.existsSync(servicePath)) {
    throw new Error('src/services/api/brandingService.ts does not exist');
  }

  const content = fs.readFileSync(servicePath, 'utf8');

  // Verify class and methods exist in file
  assert(content.includes('class BrandingService'), 'BrandingService class must be defined');
  assert(content.includes('static async getSiteBranding'), 'getSiteBranding must be defined');
  assert(content.includes('static async getDynamicBanners'), 'getDynamicBanners must be defined');
  assert(content.includes('site_branding_meta'), 'Must use persistent cache key for branding meta');
  assert(content.includes('site_banners_list'), 'Must use persistent cache key for banners');

  // Check types/interfaces
  assert(content.includes('export interface SiteBrandingInfo'), 'SiteBrandingInfo interface must be exported');
  assert(content.includes('export interface DynamicCarouselSlide'), 'DynamicCarouselSlide interface must be exported');

  // Execute live API check using standard node fetch to mirror the service's logic
  console.log('--- Step 2: Testing live endpoints compatibility ---');
  const https = require('https');
  const fetchJson = (url) => new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ThrivingSkillsMobile/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });

  const root = await fetchJson('https://thrivingskill.com/wp-json');
  assert.strictEqual(root.status, 200, 'wp-json root should return 200');
  assert.strictEqual(root.json.name, 'Thrivingskills', 'Site name should match');
  assert(root.json.description && root.json.description.length > 0, 'Site description should not be empty');
  console.log('✓ wp-json root verified:', root.json.name, '-', root.json.description);

  const collections = await fetchJson('https://thrivingskill.com/wp-json/wp/v2/lp_collection?_embed&per_page=5');
  assert.strictEqual(collections.status, 200, 'lp_collection should return 200');
  assert(Array.isArray(collections.json) && collections.json.length > 0, 'lp_collection should return items');
  console.log(`✓ lp_collection verified with ${collections.json.length} items`);

  console.log('ALL BRANDING SERVICE SPEC CHECKS PASSED!');
}

main().catch(err => {
  console.error('TEST FAILED:', err.message);
  process.exit(1);
});
