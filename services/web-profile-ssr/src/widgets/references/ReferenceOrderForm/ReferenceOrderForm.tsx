'use client';

import {
  Autocomplete,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { i18n } from '@supreme-int/i18n';
import { useEffect, useState } from 'react';
import {
  orderReference,
  type ReferenceOrderOptions,
  type ReferenceTypeOption,
} from 'services/web-profile-ssr/app/profile/references/actions';
import { PICKUP_POINTS } from 'services/web-profile-ssr/src/entities/Reference/pickupPoints';

type TypeOption = ReferenceTypeOption | string;

const REFERENCE_TYPE_INPUT_ID = 'application_type';
const REFERENCE_PICKUP_SELECT_ID = 'application_pickup';

type FormState = { type: string; pickupPointId: string; virtualOnly: boolean };
const INITIAL_FORM_STATE: FormState = { type: '', pickupPointId: '', virtualOnly: false };

type Props = { orderOptions: ReferenceOrderOptions; onSuccess: () => void };
export const ReferenceOrderForm = ({ orderOptions, onSuccess }: Props) => {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { type, pickupPointId, virtualOnly } = formState;
  const pickupIds = type ? (orderOptions.pickupPointIdsByType[type] ?? orderOptions.defaultPickupPointIds) : [];
  const pickupPoints = pickupIds.map((id) => PICKUP_POINTS[id]).filter(Boolean);

  // biome-ignore lint/correctness/useExhaustiveDependencies: при установке type автоматически выбираем первый pickup point
  useEffect(() => setFormState((prev) => ({ ...prev, pickupPointId: pickupIds[0] ?? '' })), [type, pickupIds[0]]);

  const handleVirtualOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormState((prev) => ({ ...prev, virtualOnly: e.target.checked }));

  const handleSubmit = async () => {
    const needsPickup = !virtualOnly;
    if (!type || (needsPickup && !pickupPointId)) {
      setError(i18n('Заполните все поля'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await orderReference({
        type: type.trim(),
        pickupPointId: virtualOnly ? undefined : pickupPointId,
        virtualOnly,
      });

      if (result.success) {
        onSuccess();
        setFormState(INITIAL_FORM_STATE);
      } else {
        setError(result.error ?? i18n('Ошибка при заказе'));
      }
    } catch {
      setError(i18n('Ошибка при заказе'));
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (opt: TypeOption): string =>
    typeof opt === 'string'
      ? (orderOptions.types.find((t) => t.id === opt)?.label ?? opt)
      : (opt as ReferenceTypeOption).label;

  return (
    <Stack spacing={1}>
      <Stack spacing={2}>
        <Autocomplete<TypeOption, false, false, true>
          freeSolo
          data-tour="reference-type-input"
          options={orderOptions.types}
          disableClearable={false}
          slotProps={{ paper: { sx: { bgcolor: '#fff' } } }}
          getOptionLabel={getTypeLabel}
          isOptionEqualToValue={(opt, val) =>
            (typeof opt === 'string' ? opt : (opt as ReferenceTypeOption).id) ===
            (typeof val === 'string' ? val : (val as ReferenceTypeOption)?.id)
          }
          value={type || null}
          onChange={(_, value) =>
            setFormState((prev) => ({
              ...prev,
              type: (typeof value === 'string' ? value : ((value as ReferenceTypeOption)?.id ?? '')).trim(),
            }))
          }
          onInputChange={(_, value) => setFormState((prev) => ({ ...prev, type: value.trim() }))}
          renderInput={(params) => (
            <TextField
              {...params}
              id={REFERENCE_TYPE_INPUT_ID}
              label={i18n('Тип справки')}
              InputLabelProps={{
                ...params.InputLabelProps,
                id: `${REFERENCE_TYPE_INPUT_ID}-label`,
                htmlFor: REFERENCE_TYPE_INPUT_ID,
              }}
              inputProps={{ ...params.inputProps, id: REFERENCE_TYPE_INPUT_ID }}
            />
          )}
        />

        {!virtualOnly && (
          <FormControl fullWidth disabled={!type} data-tour="reference-pickup-select">
            <InputLabel id={REFERENCE_PICKUP_SELECT_ID}>{i18n('Где получить справку')}</InputLabel>
            <Select
              labelId={REFERENCE_PICKUP_SELECT_ID}
              value={type ? pickupPointId : ''}
              label={i18n('Где получить справку')}
              MenuProps={{ slotProps: { paper: { sx: { bgcolor: '#fff' } } } }}
              onChange={(e) => setFormState((prev) => ({ ...prev, pickupPointId: e.target.value }))}
              renderValue={(v) => {
                if (!v || !type) return i18n('Сначала выберите тип справки');
                const p = PICKUP_POINTS[v];
                return p ? `${p.name} — ${p.address}, ${p.room}` : v;
              }}
            >
              {pickupPoints.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} — {p.address}, {p.room}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      <FormControlLabel
        control={<Checkbox checked={virtualOnly} onChange={handleVirtualOnlyChange} size="small" />}
        label={<Typography variant="body2">{i18n('Только виртуальная справка (PDF)')}</Typography>}
        sx={{ marginTop: 1 }}
        data-tour="reference-virtual-checkbox"
      />

      {error && <Typography color="error">{error}</Typography>}

      <Button
        variant="outlined"
        color="primary"
        onClick={handleSubmit}
        disabled={!type || (!virtualOnly && !pickupPointId)}
        loading={loading}
      >
        {i18n('Заказать')}
      </Button>
    </Stack>
  );
};
