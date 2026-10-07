import Quiz from '../demos/Quiz';
import Recipe from '../demos/Recipe';
import { Chapter } from '../kit/Chapter';

export default function Build() {
    return (
        <Chapter
            id="build"
            extra={
                <>
                    <Quiz />
                    <div className="sg-reading">
                        <h4>Further reading</h4>
                        <p>For a larger series, consider caching repeated marks or moving field generation to a worker. Preserve the random stream and ink order when comparing optimizations.</p>
                        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas" target="_blank" rel="noreferrer">
                            Canvas performance — MDN ↗
                        </a>
                        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame" target="_blank" rel="noreferrer">
                            Frame scheduling — MDN ↗
                        </a>
                        <a href="https://mrl.cs.nyu.edu/~perlin/noise/" target="_blank" rel="noreferrer">
                            Ken Perlin’s improved noise reference ↗
                        </a>
                    </div>
                </>
            }
        >
            <Recipe />
        </Chapter>
    );
}
