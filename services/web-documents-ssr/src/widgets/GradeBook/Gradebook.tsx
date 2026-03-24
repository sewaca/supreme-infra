'use client';

import type { UserGradeResponse } from '@supreme-int/api-client/src/core-client-info/types.gen';
import { useState } from 'react';
import styles from './Gradebook.module.css';

interface Props {
  grades: UserGradeResponse[];
}

interface SemesterGroup {
  course: number;
  semester: number;
  rows: UserGradeResponse[];
}

function groupBySemester(grades: UserGradeResponse[]): SemesterGroup[] {
  const map = new Map<string, SemesterGroup>();

  for (const g of grades) {
    const key = `${g.course}-${g.semester}`;
    if (!map.has(key)) {
      map.set(key, { course: g.course, semester: g.semester, rows: [] });
    }
    map.get(key)?.rows.push(g);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.course !== b.course ? b.course - a.course : b.semester - a.semester,
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(2);
  return `${day}.${month}.${year}`;
}

function formatGrade(grade: string | null): string {
  if (grade === null) return '';
  const n = Number(grade);
  if (Number.isInteger(n)) return String(n);
  return grade;
}

export const Gradebook = ({ grades }: Props) => {
  const groups = groupBySemester(grades);
  const [activeSemester, setActiveSemester] = useState<string>(
    groups.length > 0 ? `${groups[0].course}-${groups[0].semester}` : '',
  );

  const active = groups.find((g) => `${g.course}-${g.semester}` === activeSemester);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>Зачётная книжка</div>
        <div className={styles.headerSub}>
          Санкт-Петербургский государственный электротехнический университет «ЛЭТИ»
        </div>
      </div>

      <div className={styles.tabs}>
        {groups.map((g) => {
          const key = `${g.course}-${g.semester}`;
          return (
            <button
              key={key}
              type="button"
              className={`${styles.tab} ${activeSemester === key ? styles.tabActive : ''}`}
              onClick={() => setActiveSemester(key)}
            >
              {g.course} курс, {g.semester} сем.
            </button>
          );
        })}
      </div>

      {active && (
        <div className={styles.tableWrapper}>
          <div className={styles.semesterHeading}>
            {active.course} курс — {active.semester} семестр
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colNum}>№ п/п</th>
                <th className={styles.colName}>Наименование учебных дисциплин и практик</th>
                <th className={styles.colHours}>
                  Кол-во
                  <br />
                  часов по
                  <br />
                  уч.плану
                </th>
                <th className={styles.colGrade} colSpan={2}>
                  Оценка
                </th>
                <th className={styles.colTeacher}>ФИО преподавателя, дата сдачи экзамена (зачёта)</th>
              </tr>
              <tr>
                <th />
                <th />
                <th />
                <th className={styles.colExam}>
                  Экз./
                  <br />
                  КР/КП
                </th>
                <th className={styles.colCredit}>Зачёт</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {active.rows.map((row, idx) => {
                const isExam = row.grade_type === 'exam';
                const examGrade = isExam ? formatGrade(row?.grade ?? null) : '';
                const creditGrade = !isExam ? (row.grade === null ? 'зачтено' : formatGrade(row?.grade ?? null)) : '';

                return (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td className={styles.nameCell}>{row.subject}</td>
                    <td>{row.hours}</td>
                    <td className={styles.gradeCell}>{examGrade}</td>
                    <td className={styles.gradeCell}>{creditGrade}</td>
                    <td className={styles.teacherCell}>
                      {row.teacher}
                      <br />
                      <span className={styles.dateStr}>{formatDate(row.grade_date)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
