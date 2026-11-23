// Reads names out of .bolt source text (no VS Code needed, so it can be tested).
// Used for completions: components, pages, styles, resources and files.

'use strict';

// Everything a project defines, found with simple line patterns.
function scanSource(text) {
  const out = { components: [], pages: [], styles: [], resources: [], actions: [] };
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');

  let inStyles = false;
  for (const line of lines) {
    // Leaving the styles block: any non-empty line that is not indented
    if (inStyles && /^\S/.test(line)) inStyles = false;

    let m;
    if ((m = line.match(/^\s*component\s+([A-Za-z_]\w*)(.*)$/))) {
      const rest = m[2];
      const props = (rest.match(/\b(?:for|takes)\s+([\w\s,]+?)\s*:?\s*$/) || [])[1];
      out.components.push({ name: m[1], props: props ? props.split(',').map(s => s.trim()).filter(Boolean) : [] });
    } else if ((m = line.match(/^\s*page\s+([A-Za-z_]\w*)(?:\(([^)]*)\))?/))) {
      out.pages.push({ name: m[1], params: m[2] ? m[2].split(',').map(s => s.trim()).filter(Boolean) : [] });
    } else if ((m = line.match(/^\s*action\s+([A-Za-z_]\w*)/))) {
      out.actions.push({ name: m[1] });
    } else if ((m = line.match(/^\s*resource\s+([A-Za-z_]\w*)\s+at\s+"([^"]*)"/))) {
      out.resources.push({ name: m[1], url: m[2] });
      out.pages.push({ name: m[1], params: [] }); // a resource is also a page
    } else if (/^styles:\s*$/.test(line)) {
      inStyles = true;
    } else if (inStyles && (m = line.match(/^\s+([A-Za-z_][\w-]*):\s*(.+?)\s*$/)) && !line.trim().startsWith('//')) {
      out.styles.push({ name: m[1], classes: m[2] });
    }
  }
  return out;
}

// Merge the results of several files.
function mergeScans(list) {
  const all = { components: [], pages: [], styles: [], resources: [], actions: [] };
  for (const s of list) for (const k of Object.keys(all)) all[k].push(...s[k]);
  return all;
}

// What is the cursor doing? Decides which suggestions make sense.
function contextAt(linePrefix) {
  const t = linePrefix.replace(/^\s+/, '');
  if (/^use\s+[\w./-]*$/.test(t)) return 'file';
  // typing inside the class list of `styled as:` (names from styles: or Tailwind classes)
  if (/\bstyled\s+as:\s*[^\n]*$/.test(t)) return 'style';
  if (/\b(?:go\s+to|link\s+.*\s+to)\s+\w*$/.test(t)) return 'page';
  if (/^show\s+[A-Z]\w*$|^show\s+$/.test(t) || /^[A-Z]\w*$/.test(t)) return 'component';
  if (/^\w*$/.test(t)) return 'statement';
  return 'any';
}

module.exports = { scanSource, mergeScans, contextAt };
