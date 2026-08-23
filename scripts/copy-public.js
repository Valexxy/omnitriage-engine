const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../dashboard');
const dest = path.join(__dirname, '../public');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

if (fs.existsSync(src)) {
  fs.readdirSync(src).forEach(file => {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  });
  console.log('[Build] Successfully synchronized dashboard assets to public directory.');
}
