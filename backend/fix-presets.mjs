import fs from 'fs';
const p = 'src/main/java/com/aerosuite/studio/AeroStudioLetterheadPresets.java';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  /\.formatted\(pageW, pageH, trimW, trimH, bleed, extraCss, crop, bodyHtml\)\n\s*\.replace\("<div", "<div"\)\n\s*\.replace\("<\/motion>", "<\/motion>"\)\n\s*\.replace\("<\/motion>", "<\/motion>"\);/,
  '.formatted(pageW, pageH, trimW, trimH, bleed, extraCss, crop, bodyHtml);'
);
fs.writeFileSync(p, c);
console.log('fixed');
