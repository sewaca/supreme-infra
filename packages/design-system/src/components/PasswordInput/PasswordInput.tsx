'use client';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { type ComponentProps, useState } from 'react';

type Props = Omit<ComponentProps<typeof TextField>, 'type' | 'slotProps'> & {
  autoComplete?: string;
};

export const PasswordInput = ({ autoComplete = 'current-password', ...props }: Props) => {
  const [show, setShow] = useState(false);

  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      autoComplete={autoComplete}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShow((v) => !v)}
                edge="end"
                aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
                tabIndex={-1}
              >
                {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
