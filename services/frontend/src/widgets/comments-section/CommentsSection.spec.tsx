import { render, screen } from '@testing-library/react';
import { Comment } from '../../shared/api/backendApi';
import { CommentsSection } from './CommentsSection';

describe('CommentsSection', () => {
  const mockComments: Comment[] = [
    {
      postId: 1,
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      body: 'First comment',
    },
    {
      postId: 1,
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      body: 'Second comment',
    },
  ];

  it('should render comments section with title and count', () => {
    render(<CommentsSection comments={mockComments} />);

    expect(screen.getByText('Comments (2)')).toBeInTheDocument();
  });

  it('should render all comments', () => {
    render(<CommentsSection comments={mockComments} />);

    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();
  });

  it('should render empty state when no comments', () => {
    render(<CommentsSection comments={[]} />);

    expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
  });
});
