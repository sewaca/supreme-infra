import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mockComments, mockPosts } from './mocks';

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
