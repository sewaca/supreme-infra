import { getTokenFromCookies, getUserFromToken } from '@supreme-int/nextjs-shared/src/shared/jwt/decode-jwt';
import { cookies } from 'next/headers';
import Link from 'next/link';
import styles from './Header.module.css';

interface HeaderProps {
  logoText?: string;
  logoHref?: string;
}

export async function Header({ logoText = '🍳 Рецепты', logoHref = '/' }: HeaderProps) {
  const cookieStore = await cookies();
  const cookieString = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const token = getTokenFromCookies(cookieString);
  const user = getUserFromToken(token);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href={logoHref} className={styles.logo}>
          {logoText}
        </Link>

        <nav className={styles.nav}>
          {user ? (
            <>
              <span className={styles.userName}>Привет, {user.name}!</span>
              <Link href="/profile" className={styles.button}>
                Профиль
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.link}>
                Войти
              </Link>
              <Link href="/register" className={styles.button}>
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
