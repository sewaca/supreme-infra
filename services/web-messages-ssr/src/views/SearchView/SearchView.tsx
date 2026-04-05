'use client';

import { Box, List, ListItemButton, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { searchMessages } from '../../../app/messages/actions';
import type { MessageSearchResult } from '../../entities/Message/types';
import { formatMessageDate } from '../../shared/lib/formatDate';

export function SearchView() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      clearTimeout(searchTimeout);
      if (value.length < 2) {
        setResults([]);
        return;
      }
      setSearchTimeout(
        setTimeout(async () => {
          const data = await searchMessages(value);
          setResults((data.items ?? []) as MessageSearchResult[]);
        }, 300),
      );
    },
    [searchTimeout],
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск по сообщениям..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
      </Box>

      <List>
        {results.map((r) => (
          <ListItemButton
            key={r.message.id}
            onClick={() => router.push(`/messages/${r.conversation_id}`)}
            sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="subtitle2">
                {r.conversation_title ?? `${r.message.sender_name} ${r.message.sender_last_name}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatMessageDate(r.message.created_at)}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                '& mark': { bgcolor: 'warning.light', borderRadius: 0.5, px: 0.25 },
              }}
            >
              {/* TODO: это какая-то хуйня. надо переделать нормально на markdown */}
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: search highlight from trusted backend, contains only <mark> tags */}
              <span dangerouslySetInnerHTML={{ __html: r.highlight }} />
            </Typography>
          </ListItemButton>
        ))}
        {query.length >= 2 && results.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Ничего не найдено
          </Typography>
        )}
      </List>
    </Box>
  );
}
