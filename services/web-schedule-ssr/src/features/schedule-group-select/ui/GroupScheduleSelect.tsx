'use client';

import { Autocomplete, TextField } from '@mui/material';

type Props = {
  groups: string[];
  value: string;
  onChange: (groupName: string) => void;
};

export function GroupScheduleSelect({ groups, value, onChange }: Props) {
  const selected: string | undefined = value && groups.includes(value) ? value : undefined;

  return (
    <Autocomplete
      fullWidth
      size="small"
      options={groups}
      value={selected}
      onChange={(_, newValue) => {
        if (newValue !== null) onChange(newValue);
      }}
      disableClearable
      getOptionLabel={(option) => option}
      isOptionEqualToValue={(a, b) => a === b}
      noOptionsText="Нет совпадений"
      renderInput={(params) => <TextField {...params} label="Группа" placeholder="Выберите или найдите группу..." />}
      sx={{ flex: '1 1 auto', minWidth: 120, maxWidth: 320 }}
    />
  );
}
