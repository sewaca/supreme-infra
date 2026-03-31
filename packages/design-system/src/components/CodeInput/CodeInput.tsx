'use client';

import { Box, useTheme } from '@mui/material';
import { ClipboardEvent, KeyboardEvent, useRef } from 'react';

const CODE_LENGTH = 6;

const KEY_STOMP = ['code-a', 'code-b', 'code-c', 'code-d', 'code-e', 'code-f'];

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

export const CodeInput = ({ value, onChange, disabled = false, error = false }: Props) => {
  const theme = useTheme();
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(CODE_LENGTH).fill(null));

  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? '');

  const focusSlot = (index: number) => {
    const clamped = Math.max(0, Math.min(CODE_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
  };

  const setDigit = (index: number, digit: string) => {
    const arr = digits.slice();
    arr[index] = digit;
    onChange(arr.join(''));
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusSlot(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusSlot(index + 1);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index] !== '') {
        setDigit(index, '');
        focusSlot(index - 1);
      } else {
        focusSlot(index - 1);
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      setDigit(index, '');
    }
  };

  const handleInput = (index: number) => (e: React.FormEvent<HTMLInputElement>) => {
    const raw = (e.target as HTMLInputElement).value;
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    setDigit(index, digit);
    focusSlot(index + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const arr = digits.slice();
    for (let i = 0; i < pasted.length; i++) {
      if (i < CODE_LENGTH) arr[i] = pasted[i];
    }
    onChange(arr.join(''));
    focusSlot(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const handleClick = (index: number) => () => {
    focusSlot(index);
  };

  const borderColor = error ? theme.palette.error.main : theme.palette.divider;
  const focusBorderColor = error ? theme.palette.error.main : theme.palette.primary.main;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        justifyContent: 'center',
      }}
      role="group"
      aria-label="Код подтверждения"
    >
      {digits.map((digit, index) => (
        <Box
          key={`${KEY_STOMP[index]}-${digit}`}
          sx={{
            position: 'relative',
            width: 44,
            height: 56,
            borderRadius: 2,
            border: `2px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.15s',
            '&:focus-within': {
              borderColor: focusBorderColor,
            },
          }}
          onClick={handleClick(index)}
        >
          {digit === '' && (
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: theme.palette.text.disabled,
                pointerEvents: 'none',
              }}
            />
          )}
          <Box
            component="input"
            ref={(el: HTMLInputElement | null) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={digit}
            disabled={disabled}
            aria-label={`Цифра ${index + 1} из ${CODE_LENGTH}`}
            onKeyDown={handleKeyDown(index)}
            onInput={handleInput(index)}
            onPaste={handlePaste}
            onClick={handleClick(index)}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 24,
              fontWeight: 600,
              textAlign: 'center',
              color: theme.palette.text.primary,
              cursor: 'text',
              caretColor: digit === '' ? 'auto' : 'transparent',
              fontFamily: 'inherit',
              '&:disabled': {
                cursor: 'not-allowed',
                color: theme.palette.text.disabled,
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
};
