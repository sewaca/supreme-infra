import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PostSummary } from '../../shared/api/backendApi';
import { PostsListPage } from './PostsListPage';

// Mock Next.js Link component
vi.mock('next/link', () => {
  return {
    default: function MockLink({
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
    },
  };
});

describe('PostsListPage', () => {
  const mockPosts: PostSummary[] = [
    {
      userId: 1,
      id: 1,
      title: 'First Post',
      body: 'First body',
      commentsCount: 5,
    },
    {
      userId: 2,
      id: 2,
      title: 'Second Post',
      body: 'Second body',
      commentsCount: 3,
    },
  ];

  it('should render page title', () => {
    render(<PostsListPage posts={mockPosts} />);

    expect(screen.getByText('Posts')).toBeInTheDocument();
  });

  it('should render all posts', () => {
    render(<PostsListPage posts={mockPosts} />);

    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  it('should render empty state when no posts', () => {
    render(<PostsListPage posts={[]} />);

    expect(screen.getByText('Posts')).toBeInTheDocument();
  });

  it('should render breadcrumbs when userId is provided', () => {
    render(<PostsListPage posts={mockPosts} userId={1} />);

    expect(screen.getByText('all posts')).toBeInTheDocument();
    expect(screen.getByText('user 1')).toBeInTheDocument();
  });

  it('should not render breadcrumbs when userId is not provided', () => {
    const { container } = render(<PostsListPage posts={mockPosts} />);

    const breadcrumbs = container.querySelector('nav');
    expect(breadcrumbs).not.toBeInTheDocument();
  });
});
