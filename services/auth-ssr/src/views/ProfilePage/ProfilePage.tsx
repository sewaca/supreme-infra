'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { backendApi } from '../../shared/api/backendApi';
import type { User } from '../../shared/api/backendApi.types';
import { getAuthToken, removeAuthToken } from '../../shared/lib/auth.client';
import styles from './ProfilePage.module.css';

interface ProfilePageProps {
  user: User;
  isViewingOtherUser?: boolean;
}

export function ProfilePage({ user, isViewingOtherUser = false }: ProfilePageProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/');
  };

  const handleDelete = async () => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${user.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      await backendApi.deleteUser(user.id, token);
      router.push('/');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Не удалось удалить пользователя');
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Личный кабинет</h1>
          {isViewingOtherUser ? (
            <button type="button" onClick={handleDelete} disabled={isDeleting} className={styles.logoutButton}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </button>
          ) : (
            <button type="button" onClick={handleLogout} className={styles.logoutButton}>
              Выйти
            </button>
          )}
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
