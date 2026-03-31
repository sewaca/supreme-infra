'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Autocomplete, Box, CircularProgress, IconButton, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { createDirectConversation, searchUsers } from '../../../app/messages/actions';

interface UserOption {
  user_id: string;
  name: string;
  last_name: string;
  avatar: string | null;
}

export function NewMessageView() {
  const router = useRouter();
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback(
    (query: string) => {
      clearTimeout(searchTimeout);
      if (query.length < 2) {
        setOptions([]);
        return;
      }
      setSearchTimeout(
        setTimeout(async () => {
          setLoading(true);
          const users = await searchUsers(query);
          setOptions(users);
          setLoading(false);
        }, 300),
      );
    },
    [searchTimeout],
  );

  const handleSelect = useCallback(
    async (_: any, user: UserOption | null) => {
      if (!user) return;
      const result = await createDirectConversation(user.user_id);
      if (result.success && result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      }
    },
    [router],
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton component={Link} href="/messages">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Новое сообщение</Typography>
      </Box>
      <Autocomplete
        options={options}
        getOptionLabel={(opt) => `${opt.name} ${opt.last_name}`}
        onInputChange={(_, value) => handleSearch(value)}
        onChange={handleSelect}
        loading={loading}
        noOptionsText="Введите имя для поиска"
        loadingText="Поиск..."
        renderInput={(params) => (
          <TextField
            {...params}
            label="Кому"
            placeholder="Начните вводить имя..."
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    </Box>
  );
}
