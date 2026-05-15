'use client';

import { Button, Typography } from '@mui/material';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import styles from './NotFound.module.css';

const STARS = Array.from({ length: 70 }, (_, i) => ({
  top: `${((i * 37 + 13) % 93) + 2}%`,
  left: `${((i * 53 + 7) % 93) + 2}%`,
  size: `${i % 7 === 0 ? 2 : (i % 3) + 1}px`,
  delay: `${((i * 47) % 30) / 10}s`,
  duration: `${1.5 + ((i * 31) % 20) / 10}s`,
  bright: i % 7 === 0,
}));

const METEORS = [
  { top: 5, left: 18, dur: 5.2, delay: 0 },
  { top: 14, left: 52, dur: 7.1, delay: 3.4 },
  { top: 3, left: 71, dur: 4.8, delay: 7.1 },
  { top: 22, left: 38, dur: 6.3, delay: 1.8 },
  { top: 8, left: 83, dur: 5.9, delay: 11.2 },
];

const PARTICLES = [
  { left: 12, top: 78, size: 2, dur: 12, delay: 0, opacity: 0.5 },
  { left: 28, top: 85, size: 1, dur: 16, delay: 3, opacity: 0.35 },
  { left: 55, top: 90, size: 2, dur: 10, delay: 1.5, opacity: 0.45 },
  { left: 70, top: 75, size: 1, dur: 18, delay: 5, opacity: 0.3 },
  { left: 85, top: 88, size: 2, dur: 13, delay: 8, opacity: 0.4 },
  { left: 40, top: 80, size: 1, dur: 15, delay: 2.5, opacity: 0.35 },
  { left: 20, top: 72, size: 2, dur: 11, delay: 6, opacity: 0.5 },
  { left: 62, top: 82, size: 1, dur: 17, delay: 4, opacity: 0.3 },
];

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
  const [glitch, setGlitch] = useState(false);
  const glitchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const schedule = () => {
      glitchTimer.current = setTimeout(
        () => {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 220);
          schedule();
        },
        3000 + Math.random() * 5000,
      );
    };
    schedule();
    return () => clearTimeout(glitchTimer.current);
  }, []);

  return (
    <div className={styles.root}>
      {/* Stars */}
      <div className={styles.stars} aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={`${i.toString()}-star`}
            className={s.bright ? `${styles.star} ${styles.bright}` : styles.star}
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

      {/* Nebulas */}
      <div
        className={styles.nebula}
        style={
          {
            width: '360px',
            height: '300px',
            background: 'rgba(80,40,180,.20)',
            left: '-80px',
            top: '25%',
            '--nd': '18s',
            '--nx': '20px',
            '--ny': '-15px',
          } as CSSProperties
        }
        aria-hidden="true"
      />
      <div
        className={styles.nebula}
        style={
          {
            width: '280px',
            height: '220px',
            background: 'rgba(245,132,31,.16)',
            right: '22%',
            bottom: '2%',
            '--nd': '23s',
            '--nx': '-12px',
            '--ny': '18px',
          } as CSSProperties
        }
        aria-hidden="true"
      />
      <div
        className={styles.nebula}
        style={
          {
            width: '220px',
            height: '220px',
            background: 'rgba(20,80,200,.20)',
            left: '38%',
            top: '-50px',
            '--nd': '14s',
            '--nx': '22px',
            '--ny': '12px',
          } as CSSProperties
        }
        aria-hidden="true"
      />

      {/* Meteors */}
      {METEORS.map((m, i) => (
        <div
          key={`${i.toString()}-meteor`}
          className={styles.meteor}
          style={
            { top: `${m.top}%`, left: `${m.left}%`, '--dur': `${m.dur}s`, '--delay': `${m.delay}s` } as CSSProperties
          }
          aria-hidden="true"
        />
      ))}

      {/* Planet */}
      <div className={styles.planet} aria-hidden="true">
        <div className={styles.planetAtmo} />
        <div className={styles.planetShade} />
        <div className={styles.crater} />
        <div className={styles.crater2} />
        <div className={styles.crater3} />
        <div className={styles.ring} />
        <div className={styles.orbit}>
          <div className={styles.satellite}>
            <svg width="18" height="20" viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <line x1="9" y1="0" x2="9" y2="5" stroke="#8898b8" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="9" cy="0" r="1.8" fill="#f5841f" opacity=".95" />
              <rect x="5.5" y="5.5" width="7" height="7" rx="1.5" fill="#a0b4cc" />
              <rect x="6.5" y="6.5" width="5" height="5" rx=".5" fill="#7090b0" opacity=".6" />
              <rect x="0" y="7" width="4.5" height="5" rx=".8" fill="#3468a8" opacity=".95" />
              <line x1="2.25" y1="7" x2="2.25" y2="12" stroke="rgba(255,255,255,.15)" strokeWidth=".7" />
              <rect x="13.5" y="7" width="4.5" height="5" rx=".8" fill="#3468a8" opacity=".95" />
              <line x1="15.75" y1="7" x2="15.75" y2="12" stroke="rgba(255,255,255,.15)" strokeWidth=".7" />
              <rect x="7" y="12.5" width="4" height="3" rx="1" fill="#8898b8" />
              <ellipse cx="9" cy="17" rx="2" ry="2.5" fill="rgba(245,132,31,.45)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Asteroids */}
      <svg
        className={styles.asteroid}
        style={
          {
            width: '28px',
            left: '6%',
            top: '55%',
            '--at': '19s',
            '--ax': '14px',
            '--ay': '-8px',
            '--ax2': '-10px',
            '--ay2': '16px',
          } as CSSProperties
        }
        viewBox="0 0 28 22"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <ellipse cx="14" cy="11" rx="13" ry="9" fill="#5a5a6a" />
        <ellipse cx="9" cy="8" rx="3" ry="2" fill="rgba(0,0,0,.22)" />
        <ellipse cx="18" cy="14" rx="2" ry="1.2" fill="rgba(0,0,0,.18)" />
        <ellipse cx="14" cy="6" rx="1.5" ry="1" fill="rgba(255,255,255,.1)" />
      </svg>
      <svg
        className={styles.asteroid}
        style={
          {
            width: '18px',
            left: '78%',
            top: '70%',
            '--at': '27s',
            '--ax': '-20px',
            '--ay': '10px',
            '--ax2': '12px',
            '--ay2': '-18px',
          } as CSSProperties
        }
        viewBox="0 0 22 18"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon points="11,1 20,6 18,16 4,17 2,7" fill="#4a4a5a" />
        <ellipse cx="8" cy="9" rx="2" ry="1.5" fill="rgba(0,0,0,.20)" />
        <ellipse cx="15" cy="7" rx="1.5" ry="1" fill="rgba(255,255,255,.08)" />
      </svg>
      <svg
        className={styles.asteroid}
        style={
          {
            width: '14px',
            left: '45%',
            top: '82%',
            '--at': '33s',
            '--ax': '22px',
            '--ay': '-14px',
            '--ax2': '-8px',
            '--ay2': '10px',
          } as CSSProperties
        }
        viewBox="0 0 20 16"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <ellipse cx="10" cy="8" rx="9" ry="7" fill="#50505e" />
        <ellipse cx="7" cy="6" rx="2" ry="1.3" fill="rgba(0,0,0,.25)" />
        <ellipse cx="13" cy="10" rx="1.3" ry=".9" fill="rgba(0,0,0,.18)" />
      </svg>

      {/* Signal waves */}
      <div className={styles.signal} aria-hidden="true">
        <div className={styles.signalRing} />
        <div className={styles.signalRing} />
        <div className={styles.signalRing} />
      </div>

      {/* Astronaut */}
      <div className={styles.astronautWrap} aria-hidden="true">
        <div className={styles.flame} />
        <svg viewBox="0 0 80 105" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <radialGradient id="nf-hg" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#f0f4ff" />
              <stop offset="100%" stopColor="#c4cce0" />
            </radialGradient>
            <linearGradient id="nf-vg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4080d4" stopOpacity=".9" />
              <stop offset="100%" stopColor="#162e52" stopOpacity=".95" />
            </linearGradient>
          </defs>
          <rect x="24" y="77" width="13" height="22" rx="6.5" fill="#b0bcd4" />
          <rect x="43" y="77" width="13" height="22" rx="6.5" fill="#b0bcd4" />
          <ellipse cx="30" cy="98" rx="9.5" ry="5.5" fill="#8890a8" />
          <ellipse cx="50" cy="98" rx="9.5" ry="5.5" fill="#8890a8" />
          <rect x="20" y="47" width="40" height="34" rx="11" fill="#c8d2e8" />
          <rect x="31" y="45" width="18" height="8" rx="4" fill="#b4c0d8" />
          <rect x="6" y="50" width="15" height="28" rx="7.5" fill="#c8d2e8" />
          <rect x="59" y="50" width="15" height="28" rx="7.5" fill="#c8d2e8" />
          <rect x="55" y="51" width="13" height="24" rx="4.5" fill="#7888a8" />
          <rect x="57" y="49" width="9" height="6" rx="3" fill="#8898b8" />
          <rect x="60" y="73" width="4" height="7" rx="2" fill="#607090" />
          <ellipse cx="13" cy="79" rx="8" ry="5.5" fill="#a0acc4" />
          <ellipse cx="67" cy="79" rx="8" ry="5.5" fill="#a0acc4" />
          <circle cx="40" cy="27" r="24" fill="url(#nf-hg)" />
          <ellipse cx="40" cy="49" rx="13" ry="4.5" fill="#b8c4dc" />
          <ellipse cx="40" cy="28" rx="16" ry="15" fill="url(#nf-vg)" />
          <ellipse cx="33" cy="21" rx="6" ry="3.5" fill="rgba(255,255,255,.32)" transform="rotate(-18 33 21)" />
          <ellipse cx="47" cy="37" rx="3" ry="1.8" fill="rgba(255,255,255,.1)" />
          <circle cx="44" cy="20" r="1" fill="rgba(255,255,255,.55)" />
          <circle cx="48" cy="25" r=".7" fill="rgba(255,255,255,.4)" />
          <circle cx="36" cy="34" r=".8" fill="rgba(255,255,255,.35)" />
          <rect x="26" y="55" width="26" height="18" rx="4.5" fill="#3468a8" opacity=".85" />
          <circle cx="34" cy="62" r="3.2" fill="#f5841f" />
          <circle cx="34" cy="62" r="1.6" fill="#ffb86c" opacity=".7" />
          <circle cx="46" cy="62" r="3.2" fill="#3dde85" />
          <circle cx="46" cy="62" r="1.6" fill="#90ffc8" opacity=".7" />
          <rect x="28" y="69" width="22" height="2.5" rx="1.25" fill="rgba(255,255,255,.18)" />
          <line x1="40" y1="3" x2="40" y2="14" stroke="#8898b8" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="40" cy="3" r="2.8" fill="#f5841f" opacity=".95" />
          <circle cx="40" cy="3" r="1.2" fill="#ffb86c" opacity=".8" />
        </svg>
      </div>

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={`${i.toString()}-particle`}
          className={styles.particle}
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--pt': `${p.dur}s`,
              '--pd': `${p.delay}s`,
              '--po': p.opacity,
            } as CSSProperties
          }
          aria-hidden="true"
        />
      ))}

      {/* Content */}
      <div className={styles.content}>
        <div className={glitch ? `${styles.number} ${styles.numberGlitch}` : styles.number} aria-hidden="true">
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
