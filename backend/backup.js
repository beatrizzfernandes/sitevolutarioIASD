const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'bdd.sqlite');
const dir = path.join(__dirname, 'backups');

if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const dst = path.join(dir, `bdd-${today}.sqlite`);

fs.copyFileSync(src, dst);
console.log('Backup OK:', dst);
