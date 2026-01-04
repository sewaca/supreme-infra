'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login, register } from '../../shared/api/authApi';
import { setAuthToken } from '../../shared/lib/auth.client';
import styles from './AuthForm.module.css';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response =
        mode === 'login'
          ? await login({ email: formData.email, password: formData.password })
          : await register(formData);

      setAuthToken(response.accessToken);
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>
        {mode === 'login' ? 'Вход' : 'Регистрация'}
      </h2>

      {error && <div className={styles.error}>{error}</div>}

      {mode === 'register' && (
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Имя
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles.input}
            required
          />
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Пароль
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className={styles.input}
          required
          minLength={6}
        />
      </div>

      <button type="submit" className={styles.submit} disabled={isLoading}>
        {isLoading
          ? 'Загрузка...'
          : mode === 'login'
            ? 'Войти'
            : 'Зарегистрироваться'}
      </button>

      <div className={styles.footer}>
        {mode === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <a href="/register" className={styles.link}>
              Зарегистрироваться
            </a>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <a href="/login" className={styles.link}>
              Войти
            </a>
          </>
        )}
      </div>
    </form>
  );
}
