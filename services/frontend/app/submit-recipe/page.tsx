import { SubmitRecipeForm } from '../../src/widgets/SubmitRecipeForm/SubmitRecipeForm';
import styles from './page.module.css';

export default function SubmitRecipePage() {
  return (
    <div className={styles.container}>
      <SubmitRecipeForm />
    </div>
  );
}
