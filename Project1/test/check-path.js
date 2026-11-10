const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const pathname = '/';
let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
if (safePath === '/' || safePath === '\\') {
  safePath = '/index.html';
}

const filePath = path.join(PUBLIC_DIR, safePath);
console.log('PUBLIC_DIR:', PUBLIC_DIR);
console.log('safePath:', safePath);
console.log('filePath:', filePath);
console.log('exists:', fs.existsSync(filePath));

const fixedSafePath = safePath.replace(/^[/\\]+/, '');
const fixedFilePath = path.join(PUBLIC_DIR, fixedSafePath);
console.log('fixedFilePath:', fixedFilePath);
console.log('fixedExists:', fs.existsSync(fixedFilePath));
