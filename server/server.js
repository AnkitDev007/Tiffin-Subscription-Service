import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readDb, writeDb, invoice } from './store.js';

const root = new URL('../client/', import.meta.url);
const json = (res, code, body) => { res.writeHead(code, {'content-type':'application/json'}); res.end(JSON.stringify(body)); };
const body = req => new Promise((resolve, reject) => { let raw=''; req.on('data', c => raw += c); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(); } }); });
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/api/customers') {
      const db = await readDb(); const q = (url.searchParams.get('q') || '').toLowerCase();
      const status = url.searchParams.get('status');
      const customers = db.customers.filter(c => (!status || c.status === status) && (`${c.name} ${c.phone}`.toLowerCase().includes(q))).map(c => invoice(c, db.serviceDaysInMonth));
      return json(res, 200, { customers, serviceDays: db.serviceDaysInMonth });
    }
    if (req.method === 'GET' && url.pathname === '/api/dashboard') {
      const db = await readDb(); const invoices = db.customers.map(c => invoice(c, db.serviceDaysInMonth));
      return json(res, 200, { active: invoices.filter(c=>c.status==='active').length, paused: invoices.filter(c=>c.status==='paused').length, projectedCollection: invoices.reduce((sum,c)=>sum+c.invoiceAmount,0), mealsDelivered: invoices.reduce((sum,c)=>sum+c.deliveredDays,0) });
    }
    if (req.method === 'POST' && url.pathname === '/api/customers') {
      const input = await body(req); if (!input.name || !input.phone || !input.monthlyPrice) return json(res,400,{error:'name, phone and monthlyPrice are required'});
      const db = await readDb(); const customer = { id:`CUS-${Date.now()}`, name:input.name, phone:input.phone, plan:input.plan || 'Standard', monthlyPrice:Number(input.monthlyPrice), deliveredDays:0, status:'active' };
      db.customers.unshift(customer); await writeDb(db); return json(res,201,invoice(customer,db.serviceDaysInMonth));
    }
    const match = url.pathname.match(/^\/api\/customers\/(.+)\/status$/);
    if (req.method === 'PATCH' && match) { const input=await body(req), db=await readDb(), customer=db.customers.find(c=>c.id===match[1]); if(!customer) return json(res,404,{error:'Customer not found'}); customer.status=input.status==='paused'?'paused':'active'; await writeDb(db); return json(res,200,invoice(customer,db.serviceDaysInMonth)); }
    const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1); const content = await readFile(new URL(path, root)); const type = path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':'text/html'; res.writeHead(200,{'content-type':type}); res.end(content);
  } catch { json(res, 404, { error:'Route not found' }); }
});
server.listen(process.env.PORT || 3000, () => console.log('TiffinFlow running on http://localhost:3000'));
