'use client';

import type {
  PersonalDataResponse,
  StudentStatsResponse,
} from '@supreme-int/api-client/src/core-client-info/types.gen';
import styles from './StudentIdBook.module.css';

interface Props {
  user: PersonalDataResponse['user'] | null;
  stats: StudentStatsResponse | null;
}

const EDUCATION_FORM_LABELS: Record<string, string> = {
  full_time: 'Очная',
  part_time: 'Заочная',
  evening: 'Очно-заочная',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

export const StudentIdBook = ({ user, stats }: Props) => {
  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.empty}>Данные не найдены</div>
        </div>
      </div>
    );
  }

  const initials = `${user.last_name[0] ?? ''}${user.name[0] ?? ''}`;
  const fullFirstMiddle = [user.name, user.middle_name].filter(Boolean).join(' ');

  const singleFields: { label: string; value: string }[] = [
    { label: 'Факультет', value: stats?.faculty },
    { label: 'Направление', value: stats?.direction ?? stats?.specialty },
    { label: 'Профиль', value: stats?.profile },
    {
      label: 'Форма обучения',
      value: stats?.education_form ? (EDUCATION_FORM_LABELS[stats.education_form] ?? stats.education_form) : undefined,
    },
    { label: 'Квалификация', value: stats?.qualification },
  ].filter((f) => f.value) as { label: string; value: string }[];

  const hasGroupOrCourse = stats?.group || stats?.course;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerCrest}>🎓</span>
            <div>
              <div className={styles.headerTitle}>Студенческий билет</div>
              <div className={styles.headerSubtitle}>
                Санкт-Петербургский государственный <br />
                университет телекоммуникаций им. М. А. Бонч-Бруевича
              </div>
            </div>
          </div>
          <div className={styles.headerBadge}>РФ</div>
        </div>

        {/* ── Профиль ── */}
        <div className={styles.profile}>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="Фото" className={styles.photo} />
          ) : (
            <div className={styles.photoPlaceholder}>{initials}</div>
          )}
          <div className={styles.nameBlock}>
            <div className={styles.lastName}>{user.last_name}</div>
            <div className={styles.firstMiddleName}>{fullFirstMiddle}</div>
            {user.birth_date && <div className={styles.birthDate}>{formatDate(user.birth_date)}</div>}
            {stats?.status && <div className={styles.statusBadge}>{stats.status}</div>}
          </div>
        </div>

        {/* ── Академические поля ── */}
        <div className={styles.fields}>
          {singleFields.map((f) => (
            <div key={f.label} className={styles.fieldRow}>
              <div className={styles.fieldLabel}>{f.label}</div>
              <div className={styles.fieldValue}>{f.value}</div>
            </div>
          ))}

          {hasGroupOrCourse && (
            <div className={styles.fieldGridRow}>
              {stats?.group && (
                <div>
                  <div className={styles.fieldLabel}>Группа</div>
                  <div className={styles.fieldValue}>{stats.group}</div>
                </div>
              )}
              {stats?.course && (
                <div>
                  <div className={styles.fieldLabel}>Курс</div>
                  <div className={styles.fieldValue}>{stats.course}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Подвал ── */}
        <div className={styles.footer}>
          <div className={styles.footerText}>Действителен на период обучения</div>
          <div className={styles.footerYear}>{new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  );
};
