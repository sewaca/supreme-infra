export const mockPosts = [
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

export const mockComments = [
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