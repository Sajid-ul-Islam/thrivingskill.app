const fs = require('fs');

async function inspectSite() {
  try {
    const res = await fetch('https://thrivingskill.com');
    const html = await res.text();

    console.log('--- HEADER NAV ITEMS ---');
    // Find menu items inside nav or ul
    const menuMatches = html.match(/<li[^>]*class="[^"]*menu-item[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi) || [];
    const menuTexts = menuMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    const uniqueMenus = Array.from(new Set(menuTexts));
    console.log('Unique Menu Items:', uniqueMenus);

    console.log('\n--- SECTION HEADINGS ---');
    const headings = html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi) || [];
    const cleanHeadings = headings.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 2 && t.length < 100);
    console.log('Headings:', Array.from(new Set(cleanHeadings)).slice(0, 25));

    console.log('\n--- CURRENCY SAMPLES ---');
    const prices = html.match(/(?:৳|&#2547;)\s*[\d,]+/g) || [];
    console.log('Price samples:', Array.from(new Set(prices)).slice(0, 15));
  } catch (err) {
    console.error('Error fetching site:', err);
  }
}

inspectSite();
