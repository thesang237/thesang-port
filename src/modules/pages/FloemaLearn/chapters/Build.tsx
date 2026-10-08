import Demo from '../demos/Build';
import Chapter from '../kit/Chapter';
import { Quiz } from '../kit/Flashcards';

export default function BuildChapter() {
    return (
        <Chapter id="build">
            <Demo />
            <Quiz />
            <div className="fl-further">
                <span className="fl-label">KEEP LEARNING · OFFICIAL REFERENCES</span>
                <p>Go deeper only when your next project needs it.</p>
                <ul>
                    <li>
                        <a href="https://gsap.com/resources/React/" target="_blank" rel="noreferrer">
                            GSAP in React: scope and cleanup ↗
                        </a>
                    </li>
                    <li>
                        <a href="https://gsap.com/docs/v3/GSAP/gsap.timeline()/" target="_blank" rel="noreferrer">
                            GSAP timelines and timing ↗
                        </a>
                    </li>
                    <li>
                        <a href="https://gsap.com/docs/v3/Plugins/SplitText/" target="_blank" rel="noreferrer">
                            SplitText: masks and responsive lines ↗
                        </a>
                    </li>
                    <li>
                        <a href="https://r3f.docs.pmnd.rs/advanced/scaling-performance" target="_blank" rel="noreferrer">
                            React Three Fiber: scaling performance ↗
                        </a>
                    </li>
                </ul>
            </div>
        </Chapter>
    );
}
