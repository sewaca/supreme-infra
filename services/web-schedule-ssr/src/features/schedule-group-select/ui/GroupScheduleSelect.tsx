'use client';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

type Props = {
  groups: string[];
  value: string;
  onChange: (groupName: string) => void;
};

export function GroupScheduleSelect({ groups, value, onChange }: Props) {
  const selected: string | undefined = value && groups.includes(value) ? value : undefined;

  return (
    <Autocomplete
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
      sx={{ flex: '1 1 auto', minWidth: 120, maxWidth: 320 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Группа"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.8125rem',
            },
          }}
        />
      )}
    />
  );
}
