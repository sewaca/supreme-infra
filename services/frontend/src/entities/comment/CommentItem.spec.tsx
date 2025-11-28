import { render, screen } from '@testing-library/react';
import { Comment } from '../../shared/api/backendApi';
import { CommentItem } from './CommentItem';

describe('CommentItem', () => {
  const mockComment: Comment = {
    postId: 1,
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    body: 'This is a test comment',
  };

  it('should render comment with all fields', () => {
    render(<CommentItem comment={mockComment} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
  });
});
