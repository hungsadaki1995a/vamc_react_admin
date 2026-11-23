import { useTabContext } from '@/contexts/tab-context';
import styles from './screen-pending.module.scss';

/**
 * Placeholder for admin menus that exist in MENU_MNG but have no screen yet (no backend API or no screen
 * design): CIC Data, the four Statistics menus and Prohibited Words. Without it the menu did nothing on click.
 * Replace the menu's entry in `menu-component-fallback.ts` once the real screen exists.
 */
export default function ScreenPending() {
  const tab = useTabContext()?.tab;
  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>This screen is not available yet</p>
      <p className={styles.description}>
        {tab?.title ? `"${tab.title}" ` : 'This menu '}
        has no screen in this version. Contact the system administrator if you need this function.
      </p>
    </div>
  );
}
