'use client';

import { Button, Typography } from '@mui/material';
import styles from './NotFound.module.css';

const STARS = Array.from({ length: 24 }, (_, i) => ({
  top: `${((i * 37 + 13) % 93) + 2}%`,
  left: `${((i * 53 + 7) % 93) + 2}%`,
  size: `${(i % 3) + 1}px`,
  delay: `${((i * 47) % 30) / 10}s`,
  duration: `${1.5 + ((i * 31) % 20) / 10}s`,
}));

type Props = {
  homeHref?: string;
  title?: string;
  description?: string;
};

export const NotFound = ({
  homeHref = '/',
  title = 'Страница не найдена',
  description = 'Страница, которую вы ищете, не существует или была перемещена',
}: Props) => {
  return (
    <div className={styles.root}>
      <div className={styles.stars} aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={`${i.toString()}-star`}
            className={styles.star}
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      <div className={styles.planet} aria-hidden="true">
        <div className={styles.planetShade} />
        <div className={styles.crater} />
        <div className={styles.crater2} />
        <div className={styles.crater3} />
        <div className={styles.ring} />
      </div>

      <div className={styles.content}>
        <div className={styles.number} aria-hidden="true">
          404
        </div>
        <Typography variant="h5" component="h1" className={styles.title}>
          {title}
        </Typography>
        <Typography className={styles.description}>{description}</Typography>
        <Button href={homeHref} component="a" variant="contained" size="large" className={styles.button}>
          Вернуться на главную
        </Button>
      </div>
    </div>
  );
};
