'use client';

import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import { Alert, Autocomplete, Box, CircularProgress, IconButton, Snackbar, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useCallback, useState } from 'react';
import { createDirectConversation, searchUsers } from '../../../app/messages/actions';

interface UserOption {
  user_id: string;
  name: string;
  last_name: string;
  avatar: string | null;
}

interface Props {
  currentUserId: string;
}

export function NewMessageView({ currentUserId }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          setOptions(users.filter((u) => u.user_id !== currentUserId));
          setLoading(false);
        }, 300),
      );
    },
    [searchTimeout, currentUserId],
  );

  const handleSelect = useCallback(
    async (_event: SyntheticEvent, user: UserOption | null) => {
      if (!user) return;
      const result = await createDirectConversation(user.user_id);
      if (result.success && result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      } else {
        setErrorMsg(result.error ?? 'Не удалось создать чат');
      }
    },
    [router],
  );

  return (
    <Box sx={{ p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
        <IconButton component={Link} href="/messages" size="small">
          <ArrowBackIosNewRoundedIcon fontSize="inherit" color="secondary" />
        </IconButton>
        <Typography variant="title2">Новое сообщение</Typography>
      </Box>

      <Autocomplete
        options={options}
        getOptionLabel={(opt) => `${opt.name} ${opt.last_name}`}
        onInputChange={(_, value) => handleSearch(value)}
        onChange={handleSelect}
        loading={loading}
        size="small"
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

      <Snackbar open={!!errorMsg} autoHideDuration={4000} onClose={() => setErrorMsg(null)}>
        <Alert severity="error" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
