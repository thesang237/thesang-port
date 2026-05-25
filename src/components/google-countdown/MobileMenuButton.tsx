import styles from './MobileMenuButton.module.css';

type MobileMenuButtonProps = {
    visible: boolean;
    menuOpen: boolean;
    onToggle: () => void;
};

export function MobileMenuButton({ visible, menuOpen, onToggle }: MobileMenuButtonProps) {
    return (
        <button className={`${styles.mobileMenuBtn} ${styles.glassPanel} ${visible ? styles.visible : ''} ${menuOpen ? styles.menuOpen : ''}`} onClick={onToggle}>
            <div className={styles.hamburgerBar}></div>
            <div className={styles.hamburgerBar}></div>
            <div className={styles.hamburgerBar}></div>
        </button>
    );
}
