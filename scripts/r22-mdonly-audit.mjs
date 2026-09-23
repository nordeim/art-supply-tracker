// r22 pre-fix audit: extract Tailwind-class-like tokens from the repo's non-skills
// .md files and check which of them do NOT appear anywhere under src/ — the set
// of utilities that would stop compiling if markdown were excluded from TW4
// content detection. Expected: only the known dead tokens (the session_37.md
// regrown ones + possibly quoted-in-docs-only strings that are equally dead).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = "/home/z/my-project/art-supply-tracker";
const mdFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "skills", "db"].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.md$/.test(entry)) mdFiles.push(full);
  }
};
walk(repoRoot);

const srcFiles = [];
const walkSrc = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkSrc(full);
    else if (/\.(tsx|ts|css)$/.test(entry)) srcFiles.push(full);
  }
};
walkSrc(join(repoRoot, "src"));
const srcCorpus = srcFiles.map((f) => readFileSync(f, "utf8")).join("\n");

// class-like token heuristic: words with hyphens/slashes/brackets typical of TW
// utilities — conservative: only tokens with a TW-ish shape
const tokenRe = /(?<![\w`"'\[])([a-z][a-z0-9]*(?:-(?:\[[^\]\n]{1,60}\]|[a-z0-9]+))*(?::[a-z0-9-]+)*(?:\/[0-9]+)?)(?![\w`\]])/g;
const mdOnly = new Map(); // token -> [files]
for (const f of mdFiles) {
  const text = readFileSync(f, "utf8");
  // strip code fences? NO — TW4 scans the raw file; keep raw
  let m;
  while ((m = tokenRe.exec(text))) {
    const tok = m[1];
    // filter to plausible utility shapes (must contain a hyphen, not be a plain word)
    if (!tok.includes("-")) continue;
    if (/^(https?|mailto|ftp)$/.test(tok)) continue;
    if (!srcCorpus.includes(tok)) {
      if (!mdOnly.has(tok)) mdOnly.set(tok, new Set());
      mdOnly.get(tok).add(f.replace(repoRoot + "/", ""));
    }
  }
}
console.log(`scanned ${mdFiles.length} md files (non-skills), ${srcFiles.length} src files`);
console.log(`tokens in .md but NOT in src/: ${mdOnly.size}`);
// show only the ones that are LIKELY real utilities (contain typical utility prefixes)
const utilPrefixes = /^(bg|text|border|from|via|to|rounded|p|m|px|py|pt|pb|pl|pr|mt|mb|ml|mr|mx|my|w|h|min|max|flex|grid|col|row|gap|space|items|justify|self|place|overflow|z|top|bottom|left|right|inset|sticky|fixed|absolute|relative|block|inline|hidden|transition|duration|ease|delay|animate|hover|focus|active|disabled|md|lg|sm|xl|dark|shadow|opacity|font|leading|tracking|underline|uppercase|lowercase|truncate|whitespace|break|object|aspect|cursor|select|scroll|list|appearance|outline|ring|caret|fill|stroke|sr|not|isolate|contents|visible|invisible|static|transform|translate|rotate|scale|skew|origin|will|backdrop|mix|filter|blur|brightness|contrast|drop|grayscale|hue|invert|saturate|sepia|touch|pointer|resize|align|vertical|basis|grow|shrink|order|col|subgrid|flow|dense|auto|fit|min-h|min-w|max-h|max-w|antialiased|subpixel|italic|lining|ordinal|slashed|normal|diagonal|stacked|wide|tight|loose|none|tighter|looser|b|semibold|medium|light|thin|extralight|black|bold|extrabold|thin|uppercase)/;
const likely = [...mdOnly.entries()].filter(([t]) => utilPrefixes.test(t));
console.log(`\nof those, likely-utility shapes: ${likely.length}`);
for (const [tok, files] of likely.slice(0, 60)) {
  console.log(`  ${tok}  <- ${[...files].slice(0, 3).join(", ")}`);
}
