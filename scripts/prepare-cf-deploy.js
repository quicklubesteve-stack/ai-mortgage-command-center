import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, 'cf-dist');
const nextDir = path.join(projectRoot, '.next');
const serverAppDir = path.join(nextDir, 'server', 'app');
const staticDir = path.join(nextDir, 'static');
const publicDir = path.join(projectRoot, 'public');

console.log('Preparing clean Cloudflare Pages deployment directory (cf-dist)...');

// 1. Clean / create cf-dist
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Helper to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 2. Copy static chunks to cf-dist/_next/static
const destStaticDir = path.join(outDir, '_next', 'static');
if (fs.existsSync(staticDir)) {
  console.log('Copying client static assets to cf-dist/_next/static...');
  copyDir(staticDir, destStaticDir);
}

// 3. Copy public files
if (fs.existsSync(publicDir)) {
  console.log('Copying public assets to cf-dist...');
  copyDir(publicDir, outDir);
}

// 4. Map pre-rendered HTML and RSC files
const routes = [
  { name: 'index', path: '' },
  { name: 'dashboard', path: 'dashboard' },
  { name: 'intake', path: 'intake' },
  { name: 'documents', path: 'documents' },
  { name: 'qualification', path: 'qualification' },
  { name: 'underwriting', path: 'underwriting' },
  { name: 'review', path: 'review' },
  { name: 'calculators', path: 'calculators' },
  { name: 'guided-demo', path: 'guided-demo' },
  { name: 'contact', path: 'contact' },
];

for (const route of routes) {
  const htmlSrc = path.join(serverAppDir, `${route.name}.html`);
  const rscSrc = path.join(serverAppDir, `${route.name}.rsc`);

  if (fs.existsSync(htmlSrc)) {
    if (route.name === 'index') {
      fs.copyFileSync(htmlSrc, path.join(outDir, 'index.html'));
      if (fs.existsSync(rscSrc)) fs.copyFileSync(rscSrc, path.join(outDir, 'index.rsc'));
    } else {
      const destRouteDir = path.join(outDir, route.path);
      fs.mkdirSync(destRouteDir, { recursive: true });
      fs.copyFileSync(htmlSrc, path.join(destRouteDir, 'index.html'));
      fs.copyFileSync(htmlSrc, path.join(outDir, `${route.path}.html`));
      if (fs.existsSync(rscSrc)) {
        fs.copyFileSync(rscSrc, path.join(destRouteDir, 'index.rsc'));
        fs.copyFileSync(rscSrc, path.join(outDir, `${route.path}.rsc`));
      }
    }
    console.log(`✓ Mapped route: /${route.path}`);
  }
}

// Map 404
const notFoundHtml = path.join(serverAppDir, '_not-found.html');
if (fs.existsSync(notFoundHtml)) {
  fs.copyFileSync(notFoundHtml, path.join(outDir, '404.html'));
  console.log('✓ Mapped 404 page');
}

// 5. Add Cloudflare Pages _headers file for proper caching
const headersContent = `/*
  X-Robots-Tag: noindex
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`;
fs.writeFileSync(path.join(outDir, '_headers'), headersContent);

console.log('\nCloudflare Pages directory ready at cf-dist!');

