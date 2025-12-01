import { createServer, IncomingMessage, ServerResponse } from 'node:http';

// Mock data
const mockPosts = [
  {
    userId: 1,
    id: 1,
    title: 'Mock Post 1',
    body: 'This is a longer body text for mock post 1 that should be truncated in summary',
  },
  {
    userId: 1,
    id: 2,
    title: 'Mock Post 2',
    body: 'Short body',
  },
  {
    userId: 2,
    id: 3,
    title: 'Mock Post 3',
    body: 'This is another post from user 2 with a longer body text',
  },
];

const mockComments = [
  {
    postId: 1,
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    body: 'Great post!',
  },
  {
    postId: 1,
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    body: 'I completely agree with this.',
  },
  {
    postId: 2,
    id: 3,
    name: 'Bob Wilson',
    email: 'bob@example.com',
    body: 'Interesting perspective.',
  },
];

function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  res.setHeader('Content-Type', 'application/json');

  // GET /posts or /posts?userId=X
  if (url.pathname === '/posts') {
    const userId = url.searchParams.get('userId');
    if (userId) {
      const filtered = mockPosts.filter((p) => p.userId === Number(userId));
      res.writeHead(200);
      res.end(JSON.stringify(filtered));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(mockPosts));
    return;
  }

  // GET /posts/:id
  const postMatch = url.pathname.match(/^\/posts\/(\d+)$/);
  if (postMatch) {
    const postId = Number(postMatch[1]);
    const post = mockPosts.find((p) => p.id === postId);
    if (!post) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(post));
    return;
  }

  // GET /posts/:id/comments
  const commentsMatch = url.pathname.match(/^\/posts\/(\d+)\/comments$/);
  if (commentsMatch) {
    const postId = Number(commentsMatch[1]);
    const filtered = mockComments.filter((c) => c.postId === postId);
    res.writeHead(200);
    res.end(JSON.stringify(filtered));
    return;
  }

  // GET /comments
  if (url.pathname === '/comments') {
    res.writeHead(200);
    res.end(JSON.stringify(mockComments));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

const PORT = Number(process.env.MOCK_SERVER_PORT || 5000);

const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Mock server stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Mock server stopped');
    process.exit(0);
  });
});
