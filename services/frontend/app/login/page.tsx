import { AuthForm } from '../../src/widgets/AuthForm/AuthForm';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <AuthForm mode="login" />
    </div>
  );
}
