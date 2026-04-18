const fs = require('fs');
const filePath = 'src/pages/principal/AdminScreens.jsx';

let content = fs.readFileSync(filePath, 'utf8');

// Replace all corrupted non-ASCII sequences with their correct equivalents

// 1. Fix middle dots: various corrupted forms of "·"
content = content.replace(/\uFFFD\u001a·/g, '·');
content = content.replace(/\uFFFD·/g, '·');

// 2. Fix en dashes "–": corrupted forms  
content = content.replace(/â\uFFFD\u001a\uFFFD\uFFFDS/g, '–');
content = content.replace(/â\uFFFD\u001a\uFFFD\uFFFD/g, '–');

// 3. Fix box drawing char "─" used in comments
content = content.replace(/â¬\uFFFD\u001a\uFFFD/g, '─');
content = content.replace(/â⬝\uFFFD\u001a\uFFFD/g, '─');

// 4. Fix emoji: ⚡ (lightning bolt)
content = content.replace(/\uFFFDs\uFFFD/g, '⚡');

// 5. Fix emoji: ⚠ (warning sign) 
content = content.replace(/â\uFFFD/g, '⚠');
content = content.replace(/a\uFFFD/g, '⚠');

// 6. Fix emoji: 📊 (bar chart)
content = content.replace(/ðŸ\uFFFDSŠ/g, '📊');
content = content.replace(/ð\uFFFD\uFFFDSŠ/g, '📊');

// 7. Fix emoji: 📋 (clipboard)
content = content.replace(/ðŸ\uFFFDS⬹/g, '📋');
content = content.replace(/ð\uFFFD\uFFFDS⬹/g, '📋');

// 8. Fix emoji: ✅ (check mark)
content = content.replace(/â\uFFFD\u001c⬦/g, '✅');

// 9. Fix emoji: ❌ (cross mark)
content = content.replace(/â\uFFFD\u0019/g, '❌');

// 10. Fix search icon placeholder "🔍"
content = content.replace(/â\uFFFD\u001a\uFFFD\uFFFDS/g, '🔍');

// Clean up any remaining replacement characters in comment decoration lines
// Replace comment separator lines with clean ones
content = content.replace(/^(\/\/ ?).*[â⬝\uFFFD\u001a]{5,}.*$/gm, (match) => {
  if (match.includes('FOLLOW-UPS')) return '// /* ── FOLLOW-UPS ──────────────────────────────────────────────────── */';
  if (match.includes('CLASSROOM OBSERVATION')) return '// /* ── CLASSROOM OBSERVATION ──────────────────────────────────────── */';
  if (match.includes('TEACHER PERFORMANCE')) return '// /* ── TEACHER PERFORMANCE ──────────────────────────────────────── */';
  if (match.includes('USER MANAGEMENT')) return '// /* ── USER MANAGEMENT ──────────────────────────────────────── */';
  if (match.includes('TIMETABLE')) return '// /* ── TIMETABLE & MARKS ──────────────────────────────────────── */';
  if (match.includes('Export Logic')) return '// ── Export Logic ────────────────────────────────────────────────';
  if (match.includes('Leave Calendar')) return '// Leave Calendar Sub-Component';
  // Generic separator lines
  return match.replace(/[â⬝\uFFFD\u001a\u0019\u001c]+/g, '').replace(/^(\/\/ ?)/, '$1' + '─'.repeat(77));
});

// Fix active (non-commented) separator lines too
content = content.replace(/^([^/].*)[â⬝\uFFFD\u001a]{5,}.*$/gm, (match) => {
  return match.replace(/[â⬝\uFFFD\u001a\u0019\u001c]+/g, '─');
});

// Final cleanup: replace any remaining isolated replacement characters
// Only in strings/JSX text content, not in code
content = content.replace(/\uFFFD/g, '');

// Fix the section headers that were uncommented
content = content.replace(/^\/\/ â⬝.*$/gm, '// ' + '─'.repeat(77));
content = content.replace(/^â⬝.*$/gm, '─'.repeat(77));

// Write fixed content
fs.writeFileSync(filePath, content, 'utf8');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log('Replacement chars remaining:', (verify.match(/\uFFFD/g) || []).length);
console.log('Middle dots present:', verify.includes('·'));
console.log('File size:', verify.length);
