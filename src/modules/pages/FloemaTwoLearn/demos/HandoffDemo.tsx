'use client';
import { useParams } from '../kit/runtime';
import { Demo, Slider, Toggle } from '../kit/ui';
const defaults = { reveal: 50, scale: 100, offset: 0, ghost: false };
function Station({ solid = false }: { solid?: boolean }) {
    return (
        <svg viewBox="0 0 240 420" aria-hidden="true">
            <rect x="16" y="12" width="208" height="400" rx="4" fill={solid ? '#202c30' : 'none'} stroke="currentColor" strokeWidth="2" />
            <rect x="25" y="22" width="190" height="225" rx="8" fill={solid ? '#dfbb4d' : 'none'} stroke="currentColor" strokeWidth="2" />
            <path d="M35 38H205M35 235H205M26 260H214M95 261V412M115 261V412M135 261V412" stroke={solid ? '#687875' : 'currentColor'} strokeWidth="2" />
            {solid && (
                <>
                    <circle cx="80" cy="90" r="21" fill="none" stroke="#253432" strokeWidth="5" />
                    <circle cx="164" cy="90" r="21" fill="none" stroke="#253432" strokeWidth="5" />
                    <path d="m80 90 32-49 29 49H80l20-36h46l18 36" fill="none" stroke="#253432" strokeWidth="5" />
                    <path d="M47 147H193M47 157H175M47 180H193M47 190H164" stroke="#253432" strokeWidth="4" />
                </>
            )}
        </svg>
    );
}
export default function HandoffDemo() {
    const { p, set, reset } = useParams(defaults);
    return (
        <Demo
            title="Find the invisible seam"
            hint="Scrub the reveal. Use the ghost to inspect alignment before the wipe."
            reset={reset}
            tryThis="Increase scale to 115% and offset by 20px. The seam immediately exposes the mismatch; reset to restore the match cut."
            controls={
                <>
                    <Slider label="Photo reveal" value={p.reveal} min={0} max={100} onChange={(v) => set('reveal', v)} help="Uncovers the still image from the bottom." suffix="%" />
                    <Slider label="Wireframe scale" value={p.scale} min={75} max={125} onChange={(v) => set('scale', v)} help="100% means both silhouettes share their dimensions." suffix="%" />
                    <Slider
                        label="Horizontal offset"
                        value={p.offset}
                        min={-40}
                        max={40}
                        onChange={(v) => set('offset', v)}
                        help="An alignment error, deliberately exposed for learning."
                        suffix="px"
                    />
                    <Toggle label="Ghost overlay" checked={p.ghost} onChange={(v) => set('ghost', v)} help="See both silhouettes at once to compare their edges." />
                </>
            }
        >
            <div className="f2l-handoff-stage">
                <div className="f2l-match-wire" style={{ transform: `translateX(${p.offset}px) scale(${p.scale / 100})` }}>
                    <Station />
                </div>
                <div className="f2l-match-photo" style={{ clipPath: p.ghost ? 'none' : `inset(${100 - p.reveal}% 0 0 0)`, opacity: p.ghost ? 0.45 : 1 }}>
                    <Station solid />
                </div>
                {!p.ghost && (
                    <div className="f2l-match-seam" style={{ top: `${100 - p.reveal}%` }}>
                        <span>REVEAL SEAM</span>
                    </div>
                )}
                <span className="f2l-stage-caption">Simplified geometry / same screen-space rule</span>
            </div>
        </Demo>
    );
}
