import type { RefObject } from 'react';

type Props = { lottieRef: RefObject<HTMLDivElement | null> };

/** First-load intro: the logo lottie builds on black, the black lifts away, the lottie lands on the hero logo. */
export default function Loader({ lottieRef }: Props) {
    return (
        <div className="aim-loader" data-aim="loader" aria-hidden>
            <div className="aim-loader__logo">
                <div ref={lottieRef} className="aim-lottie aim-lottie--loading" data-aim="loading-lottie" />
            </div>
            <div className="aim-loader__bg" data-aim="loader-bg" />
        </div>
    );
}
