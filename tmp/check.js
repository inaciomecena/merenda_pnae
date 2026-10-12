const fs=require('fs'); const s=fs.readFileSync('apps/backend/prisma/migrations/20261011150000_reference_data_mt/migration.sql','utf8');
for(const token of ['gua Boa','Secretaria de Estado']){const i=s.indexOf(token); console.log(token, JSON.stringify(s.slice(Math.max(0,i-8),i+50)), [...s.slice(Math.max(0,i-3),i+8)].map(c=>c.codePointAt(0).toString(16)));}
