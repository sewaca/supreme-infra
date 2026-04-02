'use client';

import { Autocomplete, TextField } from '@mui/material';

export type Teacher = { id: string; name: string };

type Props = {
  teachers: Teacher[];
  value: string;
  onChange: (teacherId: string) => void;
};

export function TeacherScheduleSelect({ teachers, value, onChange }: Props) {
  const selected = teachers.find((t) => t.id === value) ?? undefined;

  return (
    <Autocomplete
      fullWidth
      size="small"
      options={teachers}
      value={selected}
      onChange={(_, newValue) => {
        if (newValue !== null) onChange(newValue.id);
      }}
      disableClearable
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      noOptionsText="Нет совпадений"
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Преподаватель..."
          sx={{
            '& .MuiInputBase-root': { borderRadius: '20px', fontSize: '0.8125rem', py: '3px' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
            '& .MuiInputBase-input': { py: '2.5px !important' },
          }}
        />
      )}
      sx={{ flex: '1 1 auto', minWidth: 160, maxWidth: 320 }}
    />
  );
}
