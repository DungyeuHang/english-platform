const fs = require('fs');
const p = 'd:/GitHub/english-platform/src/shared/components/ConfirmationDialog.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace("import ReactNode from 'react';\n", '');
fs.writeFileSync(p, c, 'utf8');
console.log('ok');
