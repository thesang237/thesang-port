import styles from './IntroModal.module.css';

type IntroModalProps = {
    show: boolean;
    onStart: () => void;
};

export function IntroModal({ show, onStart }: IntroModalProps) {
    if (!show) return null;

    return (
        <div className={styles.introModal} onClick={onStart}>
            <div className={styles.brutalistBlock}>
                SYMBIONT
                <br />
                <br />
                A BIODATA SONIFICATION AUDIO-VISUAL EXPERIENCE. WATCH AS SYNTHETIC FLORA EVOLVE FROM 10 DOWN TO 1. HOVER OVER SPORES TO INFLUENCE THE SOUND.
                <br />
                <br />
                <span className={`${styles.initiateText} ${styles.desktopText}`}>CLICK ANYWHERE TO INITIATE.</span>
                <span className={`${styles.initiateText} ${styles.mobileText}`}>TAP ANYWHERE TO INITIATE.</span>
            </div>
        </div>
    );
}
