'use client';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

type Props = {
  groups: string[];
  value: string;
  onChange: (groupName: string) => void;
};

export function GroupScheduleSelect({ groups, value, onChange }: Props) {
  return (
    <FormControl size="small" sx={{ flex: '1 1 auto', minWidth: 120, maxWidth: 320 }}>
      <InputLabel id="schedule-group-select-label">Группа</InputLabel>
      <Select
        labelId="schedule-group-select-label"
        value={value}
        label="Группа"
        onChange={(e) => onChange(e.target.value)}
        sx={{ borderRadius: '12px', fontWeight: 600, fontSize: '0.8125rem' }}
      >
        {groups.map((g) => (
          <MenuItem key={g} value={g}>
            {g}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
