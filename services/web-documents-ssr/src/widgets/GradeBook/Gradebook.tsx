import { useEffect, useRef, useState } from 'react';
import styles from './Gradebook.module.css';

const leftPageData = [
  {
    name: 'БЖД',
    hours: '144/45',
    grade: '5',
    date: '20.12.24',
    sign: '',
    teacher: 'Леонова М. Д.',
  },
  {
    name: 'Сетевые технологии',
    hours: '108/36',
    grade: '4',
    date: '25.12.24',
    sign: '',
    teacher: 'Васильев Д. В.',
  },

  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

export default function Gradebook() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [landscape, setLandscape] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateLayout = () => {
      const isLandscape = window.innerWidth < window.innerHeight;
      setLandscape(isLandscape);

      const table = tableRef.current;
      const container = containerRef.current;
      const viewport = viewportRef.current;

      if (!table || !container || !viewport) return;

      if (isLandscape) {
        const tableWidth = table.offsetWidth;
        viewport.style.height = `${tableWidth}px`;
        container.style.height = `${tableWidth}px`;
        container.style.width = '100vw';
      } else {
        container.style.height = 'auto';
        container.style.width = '100vw';
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return (
    <div className={styles.viewport} ref={viewportRef}>
      <div ref={containerRef} className={`${styles.container} ${landscape ? styles.landscape : styles.portrait}`}>
        <table ref={tableRef} className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colNum}>
                №<br />
                п/п
              </th>
              <th className={styles.colName}>Наименование дисциплины</th>
              <th className={styles.colHours}>
                Общее
                <br />
                кол-во
                <br />
                час./з. ед.
              </th>
              <th className={styles.colGrade}>Оценка</th>
              <th className={styles.colDate}>
                Дата
                <br />
                сдачи
              </th>
              <th className={styles.colSign}>Подпись</th>
              <th className={styles.colTeacher}>Преподаватель</th>
            </tr>
          </thead>

          <tbody>
            {leftPageData.map((item, index) => (
              <tr key={`${item?.name}-${item?.date}-${item?.grade}-${index}`}>
                <td>{index + 1}</td>
                <td>{item?.name}</td>
                <td>{item?.hours}</td>
                <td>{item?.grade}</td>
                <td>{item?.date}</td>
                <td>{item?.sign}</td>
                <td>{item?.teacher}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
