'use client';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Box,
  CircularProgress,
  Container,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { usePageTour } from '@supreme-int/user-tours/src/usePageTour';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import type { OrderTypeCounts } from 'services/web-profile-ssr/app/profile/orders/actions';
import { ORDER_TYPE_LABELS } from 'services/web-profile-ssr/src/entities/Order/constants';
import type { Order, OrderType } from 'services/web-profile-ssr/src/entities/Order/Order';
import { ORDER_TYPE } from 'services/web-profile-ssr/src/entities/Order/Order';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { OrderDetailModal } from '../../widgets/orders/OrderDetailModal/OrderDetailModal';
import { OrdersList } from '../../widgets/orders/OrdersList/OrdersList';

type Props = {
  initialOrders: Order[];
  typeCounts: OrderTypeCounts;
  loadMore: (offset: number, limit: number, types: OrderType[]) => Promise<Order[]>;
  initialSelectedOrder?: Order | null;
  initialSelectedTypes?: OrderType[];
};

type TypeFilter = 'all' | OrderType;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: i18n('Все') },
  { value: ORDER_TYPE.DORMITORY, label: ORDER_TYPE_LABELS[ORDER_TYPE.DORMITORY] },
  { value: ORDER_TYPE.SCHOLARSHIP, label: ORDER_TYPE_LABELS[ORDER_TYPE.SCHOLARSHIP] },
  { value: ORDER_TYPE.EDUCATION, label: ORDER_TYPE_LABELS[ORDER_TYPE.EDUCATION] },
  { value: ORDER_TYPE.GENERAL, label: ORDER_TYPE_LABELS[ORDER_TYPE.GENERAL] },
];

const INITIAL_LOAD_SIZE = 20;

export const OrdersPage = ({
  initialOrders,
  typeCounts,
  loadMore,
  initialSelectedOrder,
  initialSelectedTypes,
}: Props) => {
  const { startTour } = usePageTour({ page: 'orders' });
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTypes: TypeFilter[] = initialSelectedTypes?.length ? initialSelectedTypes : ['all'];
  const initialCacheKey = initialTypes.includes('all') ? 'all' : [...initialTypes].sort().join(',');
  const [selectedTypes, setSelectedTypes] = useState<TypeFilter[]>(initialTypes);
  const [detailModalOpen, setDetailModalOpen] = useState(!!initialSelectedOrder);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(initialSelectedOrder || null);
  const [ordersCache, setOrdersCache] = useState<Map<string, Order[]>>(new Map([[initialCacheKey, initialOrders]]));
  const [currentOrders, setCurrentOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);

  const getCacheKey = useCallback((types: TypeFilter[]): string => {
    if (types.includes('all')) return 'all';
    return [...types].sort().join(',');
  }, []);

  const loadOrdersForTypes = useCallback(
    async (types: TypeFilter[]) => {
      const cacheKey = getCacheKey(types);

      const cached = ordersCache.get(cacheKey);
      if (cached) {
        setCurrentOrders(cached);
        return;
      }

      setLoading(true);
      try {
        const activeTypes = types.includes('all') ? Object.values(ORDER_TYPE) : (types as OrderType[]);
        const orders = await loadMore(0, INITIAL_LOAD_SIZE, activeTypes);

        setOrdersCache((prev) => new Map(prev).set(cacheKey, orders));
        setCurrentOrders(orders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    },
    [ordersCache, loadMore, getCacheKey],
  );

  const handleTypeChange = useCallback(
    async (_: React.MouseEvent<HTMLElement>, newTypes: TypeFilter[]) => {
      if (newTypes.length === 0) return;

      const hasAll = newTypes.includes('all');
      const previousHasAll = selectedTypes.includes('all');

      let finalTypes: TypeFilter[];
      if (hasAll && !previousHasAll) {
        finalTypes = ['all'];
      } else if (hasAll && previousHasAll) {
        finalTypes = newTypes.filter((t) => t !== 'all');
        if (finalTypes.length === 0) finalTypes = ['all'];
      } else {
        finalTypes = newTypes.filter((t) => t !== 'all');
        if (finalTypes.length === Object.values(ORDER_TYPE).length) {
          finalTypes = ['all'];
        }
      }

      setSelectedTypes(finalTypes);

      const params = new URLSearchParams(searchParams.toString());
      if (finalTypes.includes('all')) {
        params.delete('ordersType');
      } else {
        params.set('ordersType', finalTypes.join(','));
      }
      router.replace(`/profile/orders?${params.toString()}`, { scroll: false });

      await loadOrdersForTypes(finalTypes);
    },
    [selectedTypes, router, searchParams, loadOrdersForTypes],
  );

  const displayCounts = useMemo(() => {
    const totalCount = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
    return {
      all: totalCount,
      ...typeCounts,
    };
  }, [typeCounts]);

  const handleCardClick = useCallback(
    (order: Order) => {
      setSelectedOrder(order);
      setDetailModalOpen(true);

      const params = new URLSearchParams(searchParams.toString());
      params.set('orderId', order.id);
      router.replace(`/profile/orders?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleCloseModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedOrder(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('orderId');
    router.replace(`/profile/orders?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const activeTypes = useMemo(() => {
    if (selectedTypes.includes('all')) {
      return Object.values(ORDER_TYPE);
    }
    return selectedTypes as OrderType[];
  }, [selectedTypes]);

  const handleLoadMore = useCallback(
    async (offset: number, limit: number, types: OrderType[]) => {
      const cacheKey = getCacheKey(selectedTypes);
      const newOrders = await loadMore(offset, limit, types);

      setOrdersCache((prev) => {
        const cached = prev.get(cacheKey) || [];
        return new Map(prev).set(cacheKey, [...cached, ...newOrders]);
      });

      return newOrders;
    },
    [loadMore, getCacheKey, selectedTypes],
  );

  return (
    <>
      <DefaultNavbar
        center={<Typography variant="title1">{i18n('Приказы')}</Typography>}
        rightSlot={
          <IconButton onClick={startTour} aria-label={i18n('Показать обучение')}>
            <HelpOutlineIcon fontSize="small" color="inherit" />
          </IconButton>
        }
      />
      <Container sx={{ minHeight: '100dvh', paddingBottom: 4 }}>
        <Spacer size={8} />
        <Box
          data-tour="orders-filters"
          sx={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <ToggleButtonGroup
            value={selectedTypes}
            onChange={handleTypeChange}
            sx={{
              display: 'inline-flex',
              flexWrap: 'nowrap',
              '& .MuiToggleButton-root': { px: 2, py: 0.5, flexShrink: 0 },
              '& .MuiToggleButton-root.Mui-selected': {
                color: 'primary.main',
                borderColor: 'primary.main',
                bgcolor: 'transparent',
              },
            }}
          >
            {TYPE_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.label} ({displayCounts[opt.value]})
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Spacer size={12} />

        <Box data-tour="orders-list">
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <OrdersList
              key={getCacheKey(selectedTypes)}
              initialOrders={currentOrders}
              selectedTypes={activeTypes}
              onCardClick={handleCardClick}
              loadMore={handleLoadMore}
            />
          )}
        </Box>
      </Container>

      <OrderDetailModal order={selectedOrder} open={detailModalOpen} onClose={handleCloseModal} />
    </>
  );
};
