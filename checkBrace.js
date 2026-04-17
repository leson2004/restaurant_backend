const fs=require('fs');
const lines=fs.readFileSync('src/controllers/reservationAdmin.controller.js','utf8').split(/\r?\n/);
let braces=0;
lines.forEach((line,i)=>{
  for(const c of line){
    if(c=='{') braces++;
    if(c=='}') braces--;
  }
  if(braces>0) console.log('line',i+1,'braces',braces, line.trim());
});
console.log('final braces',braces);