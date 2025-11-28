import { render, screen } from '@testing-library/react';
import { PostDetails } from '../shared/api/backendApi';
import { PostDetailsPage } from './PostDetailsPage';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

describe('PostDetailsPage', () => {
  const mockPost: PostDetails = {
    userId: 1,
    id: 1,
    title: 'Test Post Title',
    body: 'Test post body content',
    comments: [
      {
        postId: 1,
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        body: 'Test comment',
      },
    ],
  };

  it('should render post title', () => {
    render(<PostDetailsPage post={mockPost} />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Test Post Title');
  });

  it('should render post body', () => {
    render(<PostDetailsPage post={mockPost} />);

    expect(screen.getByText('Test post body content')).toBeInTheDocument();
  });

  it('should render breadcrumbs', () => {
    render(<PostDetailsPage post={mockPost} />);

    expect(screen.getByText('all posts')).toBeInTheDocument();
    expect(screen.getByText('user 1')).toBeInTheDocument();
  });

  it('should render comments section', () => {
    render(<PostDetailsPage post={mockPost} />);

    expect(screen.getByText('Comments (1)')).toBeInTheDocument();
    expect(screen.getByText('Test comment')).toBeInTheDocument();
  });
});
