import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';

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

describe('Breadcrumbs', () => {
  it('should render breadcrumbs with links and labels', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Posts', href: '/posts' },
      { label: 'Current Page' },
    ];

    render(<Breadcrumbs items={items} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/');
    expect(links[1]).toHaveAttribute('href', '/posts');
  });

  it('should render separators between items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Posts', href: '/posts' },
      { label: 'Current Page' },
    ];

    const { container } = render(<Breadcrumbs items={items} />);

    const separators = container.querySelectorAll('span');
    expect(separators.length).toBeGreaterThan(0);
  });
});
