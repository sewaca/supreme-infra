'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Autocomplete, Box, Button, Chip, IconButton, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createBroadcast, getAvailableGroups } from '../../../app/messages/actions';

export function NewBroadcastView() {
  const router = useRouter();
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getAvailableGroups().then(setGroups);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || selectedGroups.length === 0) return;
    setSending(true);
    const result = await createBroadcast(title, selectedGroups, message || undefined);
    if (result.success && result.conversationId) {
      router.push(`/messages/${result.conversationId}`);
    }
    setSending(false);
  }, [title, selectedGroups, message, router]);

  return (
    <Box sx={{ p: 2, maxWidth: 600 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton component={Link} href="/messages/broadcast">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Новая рассылка</Typography>
      </Box>

      <TextField
        fullWidth
        label="Заголовок рассылки"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Autocomplete
        multiple
        options={groups}
        value={selectedGroups}
        onChange={(_, value) => setSelectedGroups(value)}
        renderTags={(value, getTagProps) =>
          value.map((group, index) => <Chip label={group} {...getTagProps({ index })} key={group} />)
        }
        renderInput={(params) => <TextField {...params} label="Группы" placeholder="Выберите группы..." />}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={4}
        label="Первое сообщение (необязательно)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!title.trim() || selectedGroups.length === 0 || sending}
        fullWidth
      >
        Создать рассылку
      </Button>
    </Box>
  );
}
