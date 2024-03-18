const http = require('http');
const url = require('url');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 8900;

// Load users data
let users = [];
try {
  const data = fs.readFileSync('auth.json', 'utf8');
  const parsedData = JSON.parse(data);
  users = parsedData.users; // Assuming the JSON structure provided
} catch (err) {
  console.error('Error reading or parsing auth.json:', err);
}

const authenticateUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
};

const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);
  const path = reqUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Basic Authentication
  const auth = req.headers['authorization']; // Get the Authorization header
  let isAuthenticated = false;

  if (auth) {
    const [username, password] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    isAuthenticated = authenticateUser(username, password);
  }

  if (!isAuthenticated) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="User Visible Realm"' });
    res.end(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }

  // Set common headers
  res.setHeader('Content-Type', 'application/json');

  const response = {
    path: trimmedPath,
    method: req.method,
    message: ''
  };

  if (['books', 'books/author'].includes(trimmedPath) || trimmedPath.startsWith('books/') || trimmedPath.startsWith('books/author')) {
    handleEndpoint(req, res, response);
  } else {
    response.message = 'Not found';
    res.writeHead(404);
    res.end(JSON.stringify(response));
  }
});

const handleEndpoint = (req, res, response) => {
  switch (req.method) {
    case 'GET':
      response.message = `Fetching ${response.path}`;
      res.writeHead(200);
      break;
    case 'POST':
      response.message = `Adding a new entry to ${response.path}`;
      res.writeHead(201);
      break;
    case 'PUT':
      response.message = `Updating an entry in ${response.path}`;
      res.writeHead(200);
      break;
    case 'PATCH':
      response.message = `Partially updating an entry in ${response.path}`;
      res.writeHead(200);
      break;
    case 'DELETE':
      response.message = `Deleting an entry from ${response.path}`;
      res.writeHead(200);
      break;
    default:
      response.message = 'Method not allowed';
      res.writeHead(405);
  }
  res.end(JSON.stringify(response));
};

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
