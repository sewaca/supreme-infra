import { useEffect, useRef, useState } from 'react';
import styles from './StudentIdBook.module.css';

export const StudentIdBook = () => {
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
      <div ref={containerRef} className={`${styles.container} ${landscape ? styles.landscape : styles.portrait}`}></div>
    </div>
  );
};
