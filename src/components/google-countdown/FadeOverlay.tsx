import styles from './FadeOverlay.module.css';

type FadeOverlayProps = {
    active: boolean;
    onRestart: () => void;
};

export function FadeOverlay({ active, onRestart }: FadeOverlayProps) {
    return (
        <div className={`${styles.fadeOverlay} ${active ? styles.active : ''}`}>
            <div className={styles.fadeContent}>
                <h2>CULTIVATION COMPLETE</h2>
                <button className={styles.btn} onClick={onRestart}>
                    RESTART SEQUENCE
                </button>
            </div>
        </div>
    );
}
