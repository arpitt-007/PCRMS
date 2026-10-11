// Creates the database, views/procedures/triggers, sample data and demo logins.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { dbConfig } from './db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'database');
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
await conn.query(read('schema.sql'));
for (const stmt of read('programmability.sql').split(/^\$\$\s*$/m)) {
  if (stmt.trim()) await conn.query(stmt);
}
await conn.query(read('seed.sql'));

const users = [
  ['admin', 'admin123', 'admin', null],
  ['officer', 'officer123', 'officer', 1],
  ['viewer', 'viewer123', 'viewer', null],
];
for (const [u, p, role, oid] of users) {
  await conn.query('INSERT INTO pcrms.AppUser(username,password_hash,role,officer_id) VALUES (?,?,?,?)',
    [u, bcrypt.hashSync(p, 10), role, oid]);
}
console.log('Database ready. Demo logins: admin/admin123, officer/officer123, viewer/viewer123');
await conn.end();
