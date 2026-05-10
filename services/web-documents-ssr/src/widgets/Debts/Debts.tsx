'use client';

import type { AcademicDebtResponse } from '@supreme-int/api-client/src/generated/core-client-info/types.gen';
import Link from 'next/link';
import { useState } from 'react';
import { requestRetake } from '../../../app/documents/debts/actions';
import styles from './Debts.module.css';
import { RetakeRequestDialog } from './RetakeRequestDialog';

interface Props {
  debts: AcademicDebtResponse[];
  senderName: string;
}

interface SemesterGroup {
  course: number;
  semester: number;
  rows: AcademicDebtResponse[];
}

function groupBySemester(debts: AcademicDebtResponse[]): SemesterGroup[] {
  const map = new Map<string, SemesterGroup>();
  for (const d of debts) {
    const key = `${d.course}-${d.semester}`;
    if (!map.has(key)) {
      map.set(key, { course: d.course, semester: d.semester, rows: [] });
    }
    map.get(key)?.rows.push(d);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.course !== b.course ? b.course - a.course : b.semester - a.semester,
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const GRADE_TYPE_LABEL: Record<string, string> = { exam: 'Экзамен', credit: 'Зачёт' };

interface CardProps {
  debt: AcademicDebtResponse;
  senderName: string;
}

const DebtCard = ({ debt, senderName }: CardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSend = async (debtId: string, teacherId: string, content: string) => {
    await requestRetake(debtId, teacherId, content);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.subject}>{debt.subject}</span>
        <StatusBadge debt={debt} />
      </div>
      <div className={styles.meta}>
        <span>{GRADE_TYPE_LABEL[debt.grade_type] ?? debt.grade_type}</span>
        <span>{debt.hours} ч.</span>
        <span>Преподаватель: {debt.teacher_name}</span>
      </div>
      {debt.status === 'scheduled' && debt.retake_date && (
        <div className={styles.retakeInfo}>
          Дата пересдачи: {formatDate(debt.retake_date)} в {formatTime(debt.retake_date)}
          {debt.retake_classroom ? `, ${debt.retake_classroom}` : ''}
        </div>
      )}
      <div className={styles.cardBottom}>
        {debt.status === 'pending' && (
          <>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              style={{
                padding: '6px 16px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Назначить пересдачу
            </button>
            <RetakeRequestDialog
              debt={debt}
              senderName={senderName}
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              onSend={handleSend}
            />
          </>
        )}
        {(debt.status === 'requested' || debt.status === 'scheduled') && debt.conversation_id && (
          <Link href={`/messages/${debt.conversation_id}`} className={styles.chatLink}>
            Перейти в чат →
          </Link>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ debt }: { debt: AcademicDebtResponse }) => {
  if (debt.status === 'pending') {
    return <span className={`${styles.badge} ${styles.badgePending}`}>Не отправлено</span>;
  }
  if (debt.status === 'requested') {
    return <span className={`${styles.badge} ${styles.badgeRequested}`}>Запрос отправлен</span>;
  }
  if (debt.status === 'scheduled') {
    return <span className={`${styles.badge} ${styles.badgeScheduled}`}>Пересдача назначена</span>;
  }
  return null;
};

export const Debts = ({ debts, senderName }: Props) => {
  const groups = groupBySemester(debts);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>Задолженности</div>
        <div className={styles.headerSub}>
          Санкт-Петербургский государственный университет телекоммуникаций имени профессора М. А. Бонч-Бруевича
        </div>
      </div>

      {debts.length === 0 ? (
        <div className={styles.empty}>Задолженностей не обнаружено</div>
      ) : (
        groups.map((group) => (
          <div key={`${group.course}-${group.semester}`} className={styles.semesterGroup}>
            <div className={styles.semesterTitle}>
              {group.course} курс — {group.semester} семестр
            </div>
            {group.rows.map((debt) => (
              <DebtCard key={debt.id} debt={debt} senderName={senderName} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};
