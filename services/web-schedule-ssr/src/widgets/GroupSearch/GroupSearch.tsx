'use client';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type Props = {
  currentGroup: string | null;
};

export function GroupSearch({ currentGroup }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(currentGroup ?? '');

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('group', trimmed);
    params.delete('date_from');
    params.delete('date_to');
    router.push(`/calendar?${params.toString()}`);
  }

  return (
    <TextField
      size="small"
      placeholder="Группа (например: ИСТ-22-1)"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleSubmit} edge="end">
                <SearchIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={{ minWidth: 220 }}
    />
  );
}
