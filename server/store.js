import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dbPath = fileURLToPath(new URL('../data/db.json', import.meta.url));
export async function readDb() { return JSON.parse(await readFile(dbPath, 'utf8')); }
export async function writeDb(db) { await writeFile(dbPath, JSON.stringify(db, null, 2) + '\n'); }
export function invoice(customer, serviceDays) {
  const amount = Math.round((customer.monthlyPrice / serviceDays) * customer.deliveredDays);
  return { ...customer, invoiceAmount: amount, serviceDays };
}
