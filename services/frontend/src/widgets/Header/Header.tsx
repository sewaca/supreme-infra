import Link from 'next/link';
import { getUser } from '../../shared/lib/auth.server';
import styles from './Header.module.css';

export async function Header() {
  const user = await getUser();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          🍳 Рецепты
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
