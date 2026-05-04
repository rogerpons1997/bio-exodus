
import fs from 'fs';

const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    if (opens !== closes) {
        balance += opens - closes;
        console.log(`Line ${i + 1} (${opens} opens, ${closes} closes): Balance ${balance}`);
        console.log(`  Content: ${line.trim()}`);
    }
}
console.log(`Final balance: ${balance}`);
