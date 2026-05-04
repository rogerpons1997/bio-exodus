
import fs from 'fs';

const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    balance += opens - closes;
    if (balance < 0) {
        console.log(`Mismatch at line ${i + 1}: balance ${balance}`);
        console.log(`  Content: ${line.trim()}`);
    }
}
console.log(`Final balance: ${balance}`);

const fragmentOpens = (content.match(/<>/g) || []).length;
const fragmentCloses = (content.match(/<\/>/g) || []).length;
console.log(`Fragment balance: ${fragmentOpens - fragmentCloses}`);
