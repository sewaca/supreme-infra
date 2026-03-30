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
import { useCallback, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

type Step = {
  number: number;
  title: string;
  description: string;
};

const IOS_STEPS: Step[] = [
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
  { number: 3, title: 'Вставьте ссылку', description: 'Вставьте скопированную ссылку CalDAV и нажмите «Далее»' },
  {
    number: 4,
    title: 'Готово!',
    description: 'Расписание появится в приложении Календарь и будет автоматически обновляться',
  },
];

const ANDROID_STEPS: Step[] = [
  { number: 1, title: 'Установите ICSx⁵', description: 'Скачайте приложение ICSx⁵ из Google Play (бесплатное)' },
  { number: 2, title: 'Добавьте подписку', description: 'Откройте ICSx⁵, нажмите «+» и вставьте скопированную ссылку' },
  {
    number: 3,
    title: 'Настройте обновление',
    description: 'Выберите интервал обновления (рекомендуем: каждые 4 часа)',
  },
  { number: 4, title: 'Готово!', description: 'Расписание появится в Google Календаре' },
];

export function CaldavGuideDialog({ open, onClose }: Props) {
  const [caldavUrl, setCaldavUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);

  const generateUrl = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/caldav-setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Ошибка при создании ссылки');
        return;
      }
      setCaldavUrl(data.caldavUrl);
    } catch {
      setError('Не удалось создать ссылку. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, []);

  const copyUrl = useCallback(async () => {
    if (!caldavUrl) return;
    await navigator.clipboard.writeText(caldavUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [caldavUrl]);

  const handleClose = useCallback(() => {
    onClose();
    // Reset state for next open
    setTimeout(() => {
      setCaldavUrl(null);
      setError(null);
      setPlatform(null);
      setCopied(false);
    }, 300);
  }, [onClose]);

  const steps = platform === 'ios' ? IOS_STEPS : platform === 'android' ? ANDROID_STEPS : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Подключить CalDAV-календарь</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, paddingTop: '8px !important' }}>
        <Typography variant="body2" color="text.secondary">
          Расписание будет автоматически синхронизироваться с вашим календарём на телефоне.
        </Typography>

        {/* Step 1: Generate URL */}
        {!caldavUrl && !loading && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Button variant="contained" onClick={generateUrl} disabled={loading} size="large">
              Получить ссылку на календарь
            </Button>
            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        )}

        {loading && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Step 2: Show URL + copy */}
        {caldavUrl && (
          <>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                value={caldavUrl}
                size="small"
                fullWidth
                slotProps={{ input: { readOnly: true, sx: { fontSize: '0.75rem', fontFamily: 'monospace' } } }}
              />
              <IconButton onClick={copyUrl} color={copied ? 'success' : 'default'} size="small">
                {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
              </IconButton>
            </Box>

            {/* Step 3: Choose platform */}
            {!platform && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={() => setPlatform('ios')}>
                  iPhone / iPad
                </Button>
                <Button variant="outlined" onClick={() => setPlatform('android')}>
                  Android
                </Button>
              </Box>
            )}

            {/* Step 4: Show guide */}
            {platform && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
