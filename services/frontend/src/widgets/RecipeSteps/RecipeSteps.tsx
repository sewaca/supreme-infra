import type { RecipeStep } from '../../shared/api/backendApi.types';
import { MarkdownContent } from '../../shared/components/MarkdownContent/MarkdownContent';
import styles from './RecipeSteps.module.css';

interface RecipeStepsProps {
  steps: RecipeStep[];
}

export function RecipeSteps({ steps }: RecipeStepsProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Шаги приготовления</h2>
      <div className={styles.steps}>
        {steps.map((step) => (
          <div key={step.stepNumber} className={styles.step}>
            <div className={styles.stepNumber}>{step.stepNumber}</div>
            <div className={styles.stepContent}>
              <MarkdownContent content={step.instruction} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
