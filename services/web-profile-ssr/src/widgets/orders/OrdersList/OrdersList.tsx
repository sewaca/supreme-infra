'use client';

import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { i18n } from '@supreme-int/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Order, OrderType } from 'services/web-profile-ssr/src/entities/Order/Order';
import { OrderCard } from '../OrderCard/OrderCard';

type Props = {
  initialOrders: Order[];
  selectedTypes: OrderType[];
  onCardClick: (order: Order) => void;
  loadMore: (offset: number, limit: number, types: OrderType[]) => Promise<Order[]>;
};

const ITEMS_PER_PAGE = 20;

export const OrdersList = ({ initialOrders, selectedTypes, onCardClick, loadMore }: Props) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(initialOrders.length);

  useEffect(() => {
    setOrders(initialOrders);
    offsetRef.current = initialOrders.length;
    setHasMore(true);
  }, [initialOrders]);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newOrders = await loadMore(offsetRef.current, ITEMS_PER_PAGE, selectedTypes);
      if (newOrders.length === 0) {
        setHasMore(false);
      } else {
        setOrders((prev) => [...prev, ...newOrders]);
        offsetRef.current += newOrders.length;
      }
    } catch (error) {
      console.error('Failed to load more orders:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, loadMore, selectedTypes]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, handleLoadMore]);

  if (orders.length === 0 && !loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        {i18n('Нет приказов с выбранными фильтрами')}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onClick={() => onCardClick(order)} />
      ))}
      <Box ref={loadMoreRef} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        {loading && <CircularProgress size={32} />}
      </Box>
    </Stack>
  );
};
