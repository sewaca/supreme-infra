'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

type Step = { number: number; title: string; description: string };

type Platform = 'apple' | 'google' | 'yandex' | 'other';

const STEPS: Record<Platform, Step[]> = {
  apple: [
    {
      number: 1,
      title: 'Откройте Настройки',
      description: 'Перейдите в Настройки → Приложения → Календарь → Учётные записи',
    },
    {
      number: 2,
      title: 'Добавьте учётную запись',
      description: 'Нажмите «Добавить учётную запись» → «Другое» → «Подписной календарь»',
    },
    {
      number: 3,
      title: 'Вставьте ссылку',
      description: 'Вставьте скопированную ссылку и нажмите «Далее» → «Сохранить»',
    },
    {
      number: 4,
      title: 'Готово!',
      description: 'Расписание появится в приложении Календарь и будет автоматически обновляться',
    },
  ],
  google: [
    {
      number: 1,
      title: 'Откройте Google Календарь',
      description: 'Перейдите на calendar.google.com в браузере (в мобильном приложении эта функция недоступна)',
    },
    { number: 2, title: 'Добавьте подписку', description: 'Нажмите «+» рядом с «Другие календари» → «По URL»' },
    {
      number: 3,
      title: 'Вставьте ссылку',
      description: 'Вставьте скопированную ссылку и нажмите «Добавить календарь»',
    },
    {
      number: 4,
      title: 'Готово!',
      description:
        'Расписание появится в Google Календаре на всех устройствах. Синхронизация может занять до нескольких часов.',
    },
  ],
  yandex: [
    { number: 1, title: 'Откройте Яндекс Календарь', description: 'Перейдите на calendar.yandex.ru в браузере' },
    {
      number: 2,
      title: 'Добавьте подписку',
      description: 'Нажмите на шестерёнку → «Настройки» → «Подписки» → «Добавить подписку»',
    },
    {
      number: 3,
      title: 'Вставьте ссылку',
      description: 'Вставьте скопированную ссылку в поле «Ссылка на календарь» и нажмите «Подписаться»',
    },
    {
      number: 4,
      title: 'Готово!',
      description: 'Расписание появится в Яндекс Календаре. Обновление может занять до нескольких часов.',
    },
  ],
  other: [
    { number: 1, title: 'Откройте календарь', description: 'Зайдите в ваше приложение-календарь' },
    {
      number: 2,
      title: 'Найдите подписку',
      description: 'Нажмите «Подписаться на календарь» или «Добавить подписной календарь» (название может отличаться)',
    },
    { number: 3, title: 'Вставьте ссылку', description: 'Введите ссылку, которую скопировали выше, и сохраните' },
    {
      number: 4,
      title: 'Дождитесь синхронизации',
      description: 'Расписание появится в календаре. Первая синхронизация может занять до нескольких часов.',
    },
  ],
};

export function CaldavGuideDialog({ open, onClose }: Props) {
  const [caldavUrl, setCaldavUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);

  // Auto-fetch URL when dialog opens
  useEffect(() => {
    if (!open || caldavUrl || loading) return;
    setLoading(true);
    setError(null);
    fetch('/api/caldav-setup', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCaldavUrl(data.caldavUrl);
        }
      })
      .catch(() => setError('Не удалось создать ссылку. Попробуйте позже.'))
      .finally(() => setLoading(false));
  }, [open, caldavUrl, loading]);

  const copyUrl = useCallback(async () => {
    if (!caldavUrl) return;
    await navigator.clipboard.writeText(caldavUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [caldavUrl]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setPlatform(null);
      setCopied(false);
    }, 300);
  }, [onClose]);

  const steps = platform ? STEPS[platform] : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Подключить CalDAV-календарь</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, paddingTop: '8px !important' }}>
        <Typography variant="body2" color="text.secondary">
          Расписание будет автоматически синхронизироваться с календарём на вашем устройстве.
        </Typography>

        {loading && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        {caldavUrl && (
          <>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Ваша ссылка на календарь:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  value={caldavUrl}
                  size="small"
                  fullWidth
                  slotProps={{ input: { readOnly: true, sx: { fontSize: '0.75rem', fontFamily: 'monospace' } } }}
                />
                <IconButton onClick={copyUrl} color="primary" size="small">
                  {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                </IconButton>
              </Box>
            </Box>

            {!platform && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Выберите ваш календарь:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="outlined" size="small" onClick={() => setPlatform('apple')}>
                    Apple
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => setPlatform('google')}>
                    Google
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => setPlatform('yandex')}>
                    Яндекс
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => setPlatform('other')}>
                    Другое
                  </Button>
                </Box>
              </Box>
            )}

            {platform && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setPlatform(null)}
                  sx={{ alignSelf: 'flex-start', p: 0 }}
                >
                  &larr; Выбрать другой календарь
                </Button>
                {steps.map((step) => (
                  <Box key={step.number} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {step.number}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
