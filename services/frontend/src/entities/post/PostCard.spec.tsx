import { render, screen } from '@testing-library/react';
import { PostSummary } from '../../shared/api/backendApi';
import { PostCard } from './PostCard';

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

describe('PostCard', () => {
  const mockPost: PostSummary = {
    userId: 1,
    id: 1,
    title: 'Test Post',
    body: 'Test body',
    commentsCount: 5,
  };

  it('should render post card with correct props', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('Test body')).toBeInTheDocument();
    expect(screen.getByText('Comments: 5')).toBeInTheDocument();
  });

  it('should have correct link href', () => {
    render(<PostCard post={mockPost} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/1');
  });
});
