async function inspectCourses() {
  const res = await fetch('https://thrivingskill.com');
  const html = await res.text();

  // Find course items
  const courseMatches = html.match(/class="[^"]*course-item[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi) || [];
  console.log(`Found ${courseMatches.length} course item snippets`);
  if (courseMatches[0]) {
    console.log('Snippet 1:\n', courseMatches[0].slice(0, 500));
  }

  // Find price html snippets
  const priceSnippets = html.match(/class="[^"]*price[^"]*"[\s\S]*?<\/div>/gi) || [];
  console.log('Price snippets:');
  priceSnippets.slice(0, 5).forEach(s => console.log(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()));
}

inspectCourses();
