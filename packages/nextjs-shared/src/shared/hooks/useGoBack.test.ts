import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGoBack } from './useGoBack';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('useGoBack', () => {
  const mockPush = vi.fn();
  const mockGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const { useRouter, usePathname, useSearchParams } = require('next/navigation');
    useRouter.mockReturnValue({ push: mockPush });
    usePathname.mockReturnValue('/profile/orders');
    useSearchParams.mockReturnValue({ get: mockGet });
  });

  it('should navigate to retpath when it exists in query params', () => {
    mockGet.mockReturnValue('/custom/path');
    const { result } = renderHook(() => useGoBack());
    result.current();
    expect(mockPush).toHaveBeenCalledWith('/custom/path');
  });

  it('should navigate to parent path when retpath does not exist', () => {
    mockGet.mockReturnValue(null);
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/profile/orders');
    const { result } = renderHook(() => useGoBack());
    result.current();
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('should navigate to root when on first level path', () => {
    mockGet.mockReturnValue(null);
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/profile');
    const { result } = renderHook(() => useGoBack());
    result.current();
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should navigate to root when pathname is root', () => {
    mockGet.mockReturnValue(null);
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');
    const { result } = renderHook(() => useGoBack());
    result.current();
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle deep nested paths correctly', () => {
    mockGet.mockReturnValue(null);
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/profile/orders/education/details');
    const { result } = renderHook(() => useGoBack());
    result.current();
    expect(mockPush).toHaveBeenCalledWith('/profile/orders/education');
  });
});
