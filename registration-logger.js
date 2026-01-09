import fs from 'fs';
import http from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const registeredUsers = new Set();
const filePath = join(__dirname, 'registered.json');
const MAX_REGISTRATIONS = 7000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/register') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (registeredUsers.size >= MAX_REGISTRATIONS) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Max registrations reached' }));
          return;
        }

        const user = JSON.parse(body);
        const userKey = JSON.stringify(user);

        if (!registeredUsers.has(userKey)) {
          registeredUsers.add(userKey);

          const usersArray = Array.from(registeredUsers).map((u) => JSON.parse(u));
          fs.writeFileSync(filePath, JSON.stringify(usersArray, null, 2));

          console.log(`Registered user ${registeredUsers.size}/${MAX_REGISTRATIONS}: ${user.email}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: registeredUsers.size }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: registeredUsers.size, max: MAX_REGISTRATIONS }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Registration logger server running on http://localhost:${PORT}`);
});
