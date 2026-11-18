import LanguageSelector from '@/components/common/language-selector';
import vamcLogoLogin from '@/assets/vamc-logo-login.png';
import styles from './auth-header.module.scss';

/** Top header bar shared across public auth pages (Login, Find ID, Find Password). */
export default function AuthHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <img src={vamcLogoLogin} alt="VAMC" className={styles.logo} />
        <span className={styles.title}>VAMC NPL Admin System</span>
      </div>

      <div className={styles.right}>
        <LanguageSelector />
      </div>
    </header>
  );
}
