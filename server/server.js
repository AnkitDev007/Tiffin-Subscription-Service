import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { login, register, session, customers, dashboard, addCustomer, setStatus } from './database.js';

const root = new URL('../client/', import.meta.url);
const json = (res, code, body) => { res.writeHead(code, {'content-type':'application/json'}); res.end(JSON.stringify(body)); };
const body = req => new Promise((resolve, reject) => { let raw=''; req.on('data', c => raw += c); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(); } }); });
const authenticate = req => { const token=(req.headers.authorization||'').replace('Bearer ',''); const user=session(token); if(!user) throw new Error('Unauthorized'); return user; };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method==='POST' && url.pathname==='/api/auth/register') { const {name,email,password}=await body(req); return json(res,201,register(name,email,password)); }
    if (req.method==='POST' && url.pathname==='/api/auth/login') { const {email,password}=await body(req); return json(res,200,login(email,password)); }
    if (req.method === 'GET' && url.pathname === '/api/customers') { const user=authenticate(req); const result=customers(user.id,Object.fromEntries(url.searchParams)); return json(res,200,{...result,serviceDays:22}); }
    if (req.method === 'GET' && url.pathname === '/api/dashboard') return json(res,200,dashboard(authenticate(req).id));
    if (req.method === 'POST' && url.pathname === '/api/customers') {
      return json(res,201,{id:addCustomer(authenticate(req).id,await body(req))});
    }
    const match = url.pathname.match(/^\/api\/customers\/(.+)\/status$/);
    if (req.method === 'PATCH' && match) { setStatus(authenticate(req).id,match[1],(await body(req)).status); return json(res,200,{ok:true}); }
    const path = url.pathname === '/' ? 'index.html' : url.pathname === '/dashboard' ? 'dashboard.html' : url.pathname === '/login' ? 'login.html' : url.pathname.slice(1); const content = await readFile(new URL(path, root)); const type = path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':'text/html'; res.writeHead(200,{'content-type':type}); res.end(content);
  } catch (error) { json(res, error.message==='Unauthorized'?401:400, { error:error.message||'Route not found' }); }
});
server.listen(process.env.PORT || 3000, () => console.log('TiffinFlow running on http://localhost:3000'));
