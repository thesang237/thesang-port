import { forwardRef } from 'react';

/** Black sheet that wipes up over the page on navigation, then lifts off the top. */
const Transition = forwardRef<HTMLDivElement>(function Transition(_, ref) {
    return (
        <div ref={ref} className="aim-transition" aria-hidden>
            <div className="aim-transition__shape" data-aim="transition-shape" />
        </div>
    );
});

export default Transition;
