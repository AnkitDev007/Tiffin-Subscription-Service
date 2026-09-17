import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const dataDirectory = fileURLToPath(new URL('../data/', import.meta.url));
mkdirSync(dataDirectory, { recursive: true });
const db = new DatabaseSync(fileURLToPath(new URL('../data/tiffinflow.db', import.meta.url)));
const hash = password => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
const matches = (password, stored) => { const [salt, key] = stored.split(':'); return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(key, 'hex')); };
const today = () => new Date().toISOString().slice(0, 10);
const planPrice = { Starter: 2400, Standard: 3000, Family: 4800 };

db.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL, phone TEXT NOT NULL, plan TEXT NOT NULL, monthly_price INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','paused')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS deliveries (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), delivered_on TEXT NOT NULL, UNIQUE(customer_id, delivered_on));
CREATE TABLE IF NOT EXISTS pause_windows (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), start_date TEXT NOT NULL, end_date TEXT, reason TEXT);
CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), due_date TEXT NOT NULL, event_type TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(customer_id, due_date, event_type));
CREATE TABLE IF NOT EXISTS subscription_transfers (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), from_customer_id INTEGER NOT NULL REFERENCES customers(id), to_customer_id INTEGER NOT NULL REFERENCES customers(id), transferred_on TEXT NOT NULL, plan TEXT NOT NULL, monthly_price INTEGER NOT NULL, cycle_anchor TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_customers_user_name ON customers(user_id,name);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_date ON deliveries(customer_id,delivered_on);
CREATE INDEX IF NOT EXISTS idx_outbox_due_date ON outbox(due_date);`);

function seed() {
  if (db.prepare('SELECT count(*) AS count FROM users').get().count) return;
  const owner = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run('TiffinFlow Owner', 'owner@tiffinflow.test', hash('Demo@123'));
  const seedCustomers = [['Aarav Mehta','+91 98765 10482','Standard',3000,'active',17],['Meera Nair','+91 99871 44209','Starter',2400,'paused',14],['Rohan Kapoor','+91 98110 24087','Family',4800,'active',17],['Sana Iqbal','+91 90041 88902','Standard',3000,'paused',12],['Vikram Rao','+91 97683 35167','Starter',2400,'active',16]];
  const add = db.prepare('INSERT INTO customers(user_id,name,phone,plan,monthly_price,status) VALUES(?,?,?,?,?,?)');
  const delivery = db.prepare('INSERT INTO deliveries(customer_id,delivered_on) VALUES(?,?)');
  for (const [name, phone, plan, price, status, days] of seedCustomers) {
    const row = add.run(owner.lastInsertRowid, name, phone, plan, price, status);
    for (let i = 1; i <= days; i += 1) delivery.run(row.lastInsertRowid, `2026-09-${String(i).padStart(2, '0')}`);
  }
}
seed();

export const invoiceAmount = (monthlyPrice, deliveredDays, serviceDays = 22) => Math.round(monthlyPrice / serviceDays * deliveredDays);
export const isServiceDay = date => { const day = new Date(`${date}T00:00:00Z`).getUTCDay(); return day > 0 && day < 6; };
export const normalisePhone = value => String(value || '').replace(/\D/g, '');
export function normaliseDate(value) {
  if (!value) return today();
  const text = String(value).trim();
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const iso = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  const parts = dmy ? [dmy[3], dmy[2], dmy[1]] : iso ? [iso[1], iso[2], iso[3]] : null;
  if (!parts) throw new Error('Unsupported date format');
  const result = `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
  if (Number.isNaN(Date.parse(`${result}T00:00:00Z`))) throw new Error('Invalid date');
  return result;
}

export function register(name, email, password) {
  if (!name || !email || !password || password.length < 8) throw new Error('Name, email and an 8-character password are required');
  const result = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name, email.toLowerCase(), hash(password));
  return createSession(Number(result.lastInsertRowid));
}
export function login(email, password) { const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase()); if (!user || !matches(password, user.password_hash)) throw new Error('Invalid email or password'); return createSession(user.id); }
function createSession(userId) { const token = randomBytes(32).toString('hex'); db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,datetime('now','+7 days'))").run(token, userId); return { token, user: db.prepare('SELECT id,name,email FROM users WHERE id=?').get(userId) }; }
export function session(token) { return db.prepare("SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>datetime('now')").get(token); }

export function customers(userId, { q = '', page = 1, limit = 5, sort = 'name', order = 'asc' }) {
  const safeSort = ['name','plan','monthly_price','status'].includes(sort) ? sort : 'name'; const direction = order === 'desc' ? 'DESC' : 'ASC';
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50); const safePage = Math.max(Number(page) || 1, 1);
  const where = 'user_id=? AND (name LIKE ? OR phone LIKE ?)'; const args = [userId, `%${q}%`, `%${q}%`];
  const total = db.prepare(`SELECT count(*) AS total FROM customers WHERE ${where}`).get(...args).total;
  const rows = db.prepare(`SELECT c.*,count(d.id) AS deliveredDays FROM customers c LEFT JOIN deliveries d ON d.customer_id=c.id WHERE ${where} GROUP BY c.id ORDER BY ${safeSort} ${direction} LIMIT ? OFFSET ?`).all(...args, safeLimit, (safePage - 1) * safeLimit);
  return { rows, total, page: safePage, limit: safeLimit };
}
export function dashboard(userId) { return db.prepare("SELECT sum(CASE WHEN c.status='active' THEN 1 ELSE 0 END) active,sum(CASE WHEN c.status='paused' THEN 1 ELSE 0 END) paused,COALESCE(sum(x.days),0) mealsDelivered,COALESCE(round(sum(c.monthly_price/22.0*COALESCE(x.days,0))),0) projectedCollection FROM customers c LEFT JOIN (SELECT customer_id,count(*) days FROM deliveries GROUP BY customer_id) x ON x.customer_id=c.id WHERE c.user_id=?").get(userId); }
export function addCustomer(userId, input) { const { name, phone, plan = 'Standard', monthlyPrice } = input; if (!name || !phone || !monthlyPrice) throw new Error('name, phone and monthlyPrice are required'); return db.prepare("INSERT INTO customers(user_id,name,phone,plan,monthly_price,status) VALUES(?,?,?,?,?,'active')").run(userId, name.trim(), phone.trim(), plan, Number(monthlyPrice)).lastInsertRowid; }
export function setStatus(userId, id, status) { const next = status === 'paused' ? 'paused' : 'active'; const existing = db.prepare('SELECT * FROM customers WHERE id=? AND user_id=?').get(id, userId); if (!existing) throw new Error('Customer not found'); if (existing.status === next) throw new Error(`Customer is already ${next}`); db.prepare('UPDATE customers SET status=? WHERE id=? AND user_id=?').run(next, id, userId); if (next === 'paused') db.prepare('INSERT INTO pause_windows(customer_id,start_date) VALUES(?,?)').run(id, today()); else db.prepare('UPDATE pause_windows SET end_date=? WHERE customer_id=? AND end_date IS NULL').run(today(), id); }

export function runClock(dateInput) {
  const dueDate = normaliseDate(dateInput || today()); if (!isServiceDay(dueDate)) return { dueDate, scheduled: 0, message: 'No delivery notifications on weekends.' };
  const due = db.prepare("SELECT id,name,phone FROM customers WHERE status='active'").all(); const insert = db.prepare("INSERT OR IGNORE INTO outbox(customer_id,due_date,event_type,payload) VALUES(?,?,?,?)");
  let scheduled = 0; for (const customer of due) { const payload = { channel: 'Notification Service', type: 'delivery_due', customer: customer.name, phone: customer.phone, dueDate }; if (insert.run(customer.id, dueDate, 'delivery_due', JSON.stringify(payload)).changes) scheduled += 1; }
  return { dueDate, scheduled, message: 'Delivery notifications queued in the outbox.' };
}
export function outbox(date) { const params = []; const where = date ? (params.push(normaliseDate(date)), 'WHERE o.due_date=?') : ''; return db.prepare(`SELECT o.id,o.due_date,o.event_type,o.payload,o.created_at,c.name,c.phone FROM outbox o JOIN customers c ON c.id=o.customer_id ${where} ORDER BY o.id DESC`).all(...params).map(row => ({ ...row, payload: JSON.parse(row.payload) })); }

export function transferSubscription(userId, id, input) {
  const source = db.prepare('SELECT * FROM customers WHERE id=? AND user_id=?').get(id, userId); if (!source) throw new Error('Subscription not found');
  const { name, phone, effectiveDate = today() } = input; if (!name || !phone) throw new Error('New customer name and phone are required'); const transferredOn = normaliseDate(effectiveDate);
  const add = db.prepare("INSERT INTO customers(user_id,name,phone,plan,monthly_price,status) VALUES(?,?,?,?,?,'active')").run(userId, name.trim(), phone.trim(), source.plan, source.monthly_price);
  const targetId = Number(add.lastInsertRowid); db.prepare("UPDATE customers SET status='paused' WHERE id=?").run(source.id);
  db.prepare('INSERT INTO subscription_transfers(user_id,from_customer_id,to_customer_id,transferred_on,plan,monthly_price,cycle_anchor) VALUES(?,?,?,?,?,?,?)').run(userId, source.id, targetId, transferredOn, source.plan, source.monthly_price, transferredOn.slice(0, 7));
  const delivered = customerId => db.prepare('SELECT count(*) AS days FROM deliveries WHERE customer_id=?').get(customerId).days;
  return { transfer: { fromCustomerId: source.id, toCustomerId: targetId, transferredOn, plan: source.plan, monthlyPrice: source.monthly_price }, billingSplit: { previousCustomer: invoiceAmount(source.monthly_price, delivered(source.id)), newCustomer: invoiceAmount(source.monthly_price, delivered(targetId)) } };
}

export function importCustomers(userId, rows) {
  if (!Array.isArray(rows)) throw new Error('rows must be an array');
  const report = { imported: [], deduped: [], rejected: [] }; const existing = new Set(db.prepare('SELECT phone FROM customers WHERE user_id=?').all(userId).map(row => normalisePhone(row.phone)));
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {}; const phoneKey = normalisePhone(row.phone);
    if (!String(row.name || '').trim() || phoneKey.length < 10) { report.rejected.push({ row: index + 1, reason: 'name and a valid phone are required' }); continue; }
    if (existing.has(phoneKey)) { report.deduped.push({ row: index + 1, phone: row.phone, reason: 'duplicate phone' }); continue; }
    try { const startDate = normaliseDate(row.startDate || row.start_date); const plan = row.plan || 'Standard'; const monthlyPrice = Number(row.monthlyPrice || row.monthly_price || planPrice[plan]); if (!Number.isFinite(monthlyPrice) || monthlyPrice <= 0) throw new Error('valid monthly price required'); const id = addCustomer(userId, { name: row.name, phone: row.phone, plan, monthlyPrice }); existing.add(phoneKey); report.imported.push({ row: index + 1, id, name: row.name, startDate }); } catch (error) { report.rejected.push({ row: index + 1, reason: error.message }); }
  }
  return { ...report, totals: { imported: report.imported.length, deduped: report.deduped.length, rejected: report.rejected.length } };
}
