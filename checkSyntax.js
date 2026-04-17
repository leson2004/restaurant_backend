const fs = require('fs');
const code = fs.readFileSync('src/controllers/reservationAdmin.controller.js', 'utf8');

// simple check for unbalanced braces/parentheses/brackets
let braces = 0, parens = 0, brackets = 0;
for (let i = 0; i < code.length; i++) {
  const c = code[i];
  if (c === '{') braces++;
  if (c === '}') braces--;
  if (c === '(') parens++;
  if (c === ')') parens--;
  if (c === '[') brackets++;
  if (c === ']') brackets--;
}
console.log('counts', { braces, parens, brackets });

// check for unclosed single/double quotes ignoring escapes
const singles = (code.match(/(?:^|[^\\])'/g) || []).length;
const doubles = (code.match(/(?:^|[^\\])"/g) || []).length;
console.log('quotes', { singles, doubles });

// find last few lines
const lines = code.split(/\r?\n/);
console.log('last lines:', lines.slice(-10));
