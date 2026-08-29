const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'public', 'audio');

const directories = [
  path.join(baseDir, 'kitab', 'kitab-1'),
  path.join(baseDir, 'kitab', 'kitab-2'),
  path.join(baseDir, 'kitab', 'kitab-3'),
  path.join(baseDir, 'kitab', 'kitab-4'),
  path.join(baseDir, 'muhadara'),
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create sample MP3 files (valid minimal MP3 frame header)
// Frame header: 0xFF 0xFB 0x90 0x64 followed by zeroes
const minimalMp3Header = Buffer.from([
  0xFF, 0xFB, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Kitab 1 (12 ders)
for (let i = 1; i <= 12; i++) {
  const filename = `ders-${String(i).padStart(2, '0')}.mp3`;
  const filePath = path.join(baseDir, 'kitab', 'kitab-1', filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, minimalMp3Header);
  }
}

// Kitab 2 (10 ders)
for (let i = 1; i <= 10; i++) {
  const filename = `ders-${String(i).padStart(2, '0')}.mp3`;
  const filePath = path.join(baseDir, 'kitab', 'kitab-2', filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, minimalMp3Header);
  }
}

// Kitab 3 & 4
for (let i = 1; i <= 8; i++) {
  const filename = `ders-${String(i).padStart(2, '0')}.mp3`;
  const filePath = path.join(baseDir, 'kitab', 'kitab-3', filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, minimalMp3Header);
  }
}
for (let i = 1; i <= 15; i++) {
  const filename = `ders-${String(i).padStart(2, '0')}.mp3`;
  const filePath = path.join(baseDir, 'kitab', 'kitab-4', filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, minimalMp3Header);
  }
}

// Muhadaras
for (let i = 1; i <= 5; i++) {
  const filename = `muhadara-${String(i).padStart(2, '0')}.mp3`;
  const filePath = path.join(baseDir, 'muhadara', filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, minimalMp3Header);
  }
}

console.log('Audio files created successfully in public/audio/');
