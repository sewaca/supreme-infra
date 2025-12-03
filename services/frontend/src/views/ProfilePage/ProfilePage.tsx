'use client';

import { useRouter } from 'next/navigation';
import { removeAuthToken, User } from '../../shared/lib/auth.client';
import styles from './ProfilePage.module.css';

interface ProfilePageProps {
  user: User;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const router = useRouter();

  const handleLogout = () => {
    removeAuthToken();
    router.push('/');
    router.refresh();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Личный кабинет</h1>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Выйти
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.field}>
            <span className={styles.label}>Имя:</span>
            <span className={styles.value}>{user.name}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>{user.email}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>ID:</span>
            <span className={styles.value}>{user.id}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <a href="/" className={styles.link}>
            ← Вернуться к рецептам
          </a>
        </div>
      </div>
    </div>
  );
}
