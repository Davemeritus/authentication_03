// Import required modules
const http = require('http');
const url = require('url');
const fs = require('fs');

// Define server details
const hostname = '127.0.0.1';
const port = 8900;

// Load users data
let users = [];
try {
  // Read and parse the JSON file containing user data
  const data = fs.readFileSync('auth.json', 'utf8');
  const parsedData = JSON.parse(data);
  users = parsedData.users; // Assuming the JSON structure provided
} catch (err) {
  // Log any errors encountered during file reading or parsing
  console.error('Error reading or parsing auth.json:', err);
}

// Function to authenticate a user
const authenticateUser = (username, password) => {
  // Check if the provided username and password match any user in the array
  return users.some(user => user.username === username && user.password === password);
};

// Create the server
const server = http.createServer((req, res) => {
  // Parse the request URL
  const reqUrl = url.parse(req.url, true);
  const path = reqUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Basic Authentication
  const auth = req.headers['authorization']; // Get the Authorization header
  let isAuthenticated = false;

  // If authorization header is present, attempt to authenticate the user
  if (auth) {
    const [username, password] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    isAuthenticated = authenticateUser(username, password);
  }

  // If user is not authenticated, return a 401 Unauthorized response
  if (!isAuthenticated) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="User Visible Realm"' });
    res.end(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }

  // Set common headers
  res.setHeader('Content-Type', 'application/json');

  // Prepare the response object
  const response = {
    path: trimmedPath,
    method: req.method,
    message: ''
  };

  // Handle requests to the 'books' and 'books/author' endpoints
  if (['books', 'books/author'].includes(trimmedPath) || trimmedPath.startsWith('books/') || trimmedPath.startsWith('books/author')) {
    handleEndpoint(req, res, response);
  } else {
    // If endpoint is not recognized, return a 404 Not Found response
    response.message = 'Not found';
    res.writeHead(404);
    res.end(JSON.stringify(response));
  }
});

// Function to handle requests to recognized endpoints
const handleEndpoint = (req, res, response) => {
  // Handle different HTTP methods
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
      // If method is not recognized, return a 405 Method Not Allowed response
      response.message = 'Method not allowed';
      res.writeHead(405);
  }
  // Send the response
  res.end(JSON.stringify(response));
};

// Start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});