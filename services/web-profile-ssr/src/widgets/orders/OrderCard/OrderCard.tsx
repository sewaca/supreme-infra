import { Badge, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { Row } from '@supreme-int/design-system/src/components/Row/Row';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { ORDER_TYPE_LABELS } from 'services/web-profile-ssr/src/entities/Order/constants';
import type { Order } from 'services/web-profile-ssr/src/entities/Order/Order';

type Props = {
  order: Order;
  onClick: () => void;
};

export const OrderCard = ({ order, onClick }: Props) => {
  const hasNotifications = order.notifications && order.notifications?.length > 0;

  return (
    <Card elevation={2} sx={{ borderRadius: 2 }}>
      <CardActionArea onClick={onClick} sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Row justifyContent="space-between" alignItems="flex-start">
            <Stack spacing={0.5} flex={1}>
              <Typography variant="body2" color="text.secondary">
                {ORDER_TYPE_LABELS[order.type]}
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {order.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {i18n('№{{orderNumber}} от {{orderDate}}', { orderNumber: order.number, orderDate: order.date })}
              </Typography>
            </Stack>
            {hasNotifications && <Badge badgeContent={order?.notifications?.length} color="error" />}
          </Row>
        </Stack>
      </CardActionArea>
    </Card>
  );
};
