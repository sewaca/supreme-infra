import styles from './AppLogo.module.css';
import cx from 'classnames';

type Props = {
  href?: string;
  light?: boolean;
};

export function AppLogo({ href, light }: Props) {
  const inner = (
    <>
      <svg
        className={styles.sign}
        viewBox="0 0 99 98"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="29" height="28" rx="5" fill="#5A5A5A" />
        <rect x="35" y="0" width="29" height="28" rx="5" fill="#5A5A5A" />
        <rect x="0" y="35" width="29" height="28" rx="5" fill="#FF970F" />
        <rect x="35" y="35" width="29" height="28" rx="5" fill="#FF970F" />
        <rect x="0" y="70" width="29" height="28" rx="5" fill="#5A5A5A" />
        <rect x="35" y="70" width="29" height="28" rx="5" fill="#5A5A5A" />
        <rect x="70" y="70" width="29" height="28" rx="5" fill="#2F80ED" />
      </svg>
      <span className={styles.text} aria-label="ЛК СПбГУТ">
        <span className={styles.lk}>ЛК</span>
        <span className={styles.spbgut}>СПбГУТ</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={cx(styles.logo, { [styles.light]: light })} aria-label="ЛК СПбГУТ — на главную">
        {inner}
      </a>
    );
  }

  return <div className={cx(styles.logo, { [styles.light]: light })}>{inner}</div>;
}
