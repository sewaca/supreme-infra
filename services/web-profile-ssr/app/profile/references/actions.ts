'use server';

import type {
  ReferenceOrderResponse,
  ReferenceType,
} from '@supreme-int/api-client/src/generated/core-applications/types.gen';
import { CoreApplications } from '@supreme-int/api-client/src/index';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { format, parseISO } from 'date-fns';
import { PICKUP_POINTS } from 'services/web-profile-ssr/src/entities/Reference/pickupPoints';
import type { OrderedReference, ReferenceStatus } from 'services/web-profile-ssr/src/entities/Reference/Reference';
import { coreApplicationsClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getMockedUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

export type ReferenceTypeOption = { id: string; label: string };

export type ReferenceOrderOptions = {
  types: ReferenceTypeOption[];
  pickupPointIdsByType: Record<string, string[]>;
  defaultPickupPointIds: string[];
};

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  rdzd: i18n('РЖД'),
  workplace: i18n('По месту работы'),
  parents_workplace: i18n('По месту работы родителей'),
  military: i18n('Для военкомата'),
  scholarship: i18n('О стипендии'),
  study_confirmation: i18n('Подтверждение обучения'),
  academic_leave: i18n('Академический отпуск'),
  transcript: i18n('Транскрипт'),
};

function resolveTypeLabel(referenceType: string, rawLabel: string): string {
  return REFERENCE_TYPE_LABELS[referenceType] ?? rawLabel;
}

const REFERENCE_ORDER_OPTIONS: ReferenceOrderOptions = {
  types: Object.entries(REFERENCE_TYPE_LABELS)
    .slice(0, 5)
    .map(([id, label]) => ({ id, label })),
  pickupPointIdsByType: {
    rdzd: ['spbgt_hr', 'spbkt_hr'],
    workplace: ['spbgt_hr', 'spbkt_hr'],
    parents_workplace: ['spbgt_hr', 'spbkt_hr'],
    military: ['military_office'],
    scholarship: ['accounting'],
  },
  defaultPickupPointIds: ['spbgt_hr', 'spbkt_hr'],
};

function mapReference(ref: ReferenceOrderResponse): OrderedReference {
  const pickupPoint = ref.pickup_point_id ? PICKUP_POINTS[ref.pickup_point_id] : undefined;
  return {
    id: ref.id,
    type: ref.reference_type as OrderedReference['type'],
    typeLabel: resolveTypeLabel(ref.reference_type, ref.type_label),
    status: ref.status as ReferenceStatus,
    orderDate: (() => {
      try {
        return format(parseISO(ref.order_date), 'dd.MM.yyyy HH:mm:ss');
      } catch {
        return ref.order_date;
      }
    })(),
    pickupPoint,
    virtualOnly: ref.virtual_only,
    storageUntil: ref.storage_until ?? undefined,
    pdfUrl: ref.pdf_url ?? undefined,
  };
}

export const getReferenceOrderOptions = async (): Promise<ReferenceOrderOptions> => {
  return { ...REFERENCE_ORDER_OPTIONS };
};

export const getReferences = async (): Promise<OrderedReference[]> => {
  const userId = getMockedUserId();
  const res = await CoreApplications.getReferencesReferencesGet({
    client: coreApplicationsClient,
    query: { user_id: userId },
  });

  const data = res.data ?? [];
  return data.map(mapReference);
};

export const orderReference = async (params: {
  type: string;
  pickupPointId?: string;
  virtualOnly: boolean;
}): Promise<{ success: boolean; error?: string }> => {
  const userId = getMockedUserId();
  try {
    await CoreApplications.createReferenceReferencesOrderPost({
      client: coreApplicationsClient,
      query: { user_id: userId },
      body: {
        reference_type: params.type as ReferenceType,
        pickup_point_id: params.pickupPointId,
        virtual_only: params.virtualOnly,
      },
    });
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось создать заявку на справку') };
  }
};

export const cancelReference = async (referenceId: string): Promise<{ success: boolean; error?: string }> => {
  const userId = getMockedUserId();
  try {
    await CoreApplications.cancelReferenceReferencesReferenceIdCancelPost({
      client: coreApplicationsClient,
      path: { reference_id: referenceId },
      query: { user_id: userId },
    });
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось отменить справку') };
  }
};

export const extendStorage = async (referenceId: string): Promise<{ success: boolean; error?: string }> => {
  const userId = getMockedUserId();
  try {
    await CoreApplications.extendStorageReferencesReferenceIdExtendStoragePost({
      client: coreApplicationsClient,
      path: { reference_id: referenceId },
      query: { user_id: userId },
    });
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось продлить хранение') };
  }
};
