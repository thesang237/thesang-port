/**
 * Generated ambience — no audio files. Filtered brown noise (wind) plus two
 * detuned drones, and a short "tick" for UI feedback.
 */
class Ambience {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private windFilter: BiquadFilterNode | null = null;
    private on = false;

    private init() {
        if (this.ctx) return;
        const ctx = new AudioContext();
        const master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);

        // brown noise → band-pass (wind)
        const len = ctx.sampleRate * 4;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02;
            data[i] = last * 3.5;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        noise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 420;
        filter.Q.value = 0.7;
        const windGain = ctx.createGain();
        windGain.gain.value = 0.55;
        noise.connect(filter).connect(windGain).connect(master);
        noise.start();

        // slow gusts
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.07;
        lfoGain.gain.value = 260;
        lfo.connect(lfoGain).connect(filter.frequency);
        lfo.start();

        // drones
        [55, 82.4, 110.3].forEach((f, i) => {
            const o = ctx.createOscillator();
            o.type = i === 2 ? 'triangle' : 'sine';
            o.frequency.value = f;
            o.detune.value = (i - 1) * 7;
            const g = ctx.createGain();
            g.gain.value = i === 2 ? 0.025 : 0.06;
            o.connect(g).connect(master);
            o.start();
        });

        this.ctx = ctx;
        this.master = master;
        this.windFilter = filter;
    }

    toggle(next: boolean) {
        this.init();
        if (!this.ctx || !this.master) return;
        this.on = next;
        if (next) this.ctx.resume();
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setTargetAtTime(next ? 0.35 : 0, t, 0.6);
    }

    /** Scroll velocity opens the wind filter. */
    setIntensity(v: number) {
        if (!this.on || !this.ctx || !this.windFilter) return;
        this.windFilter.Q.setTargetAtTime(0.7 + Math.min(v, 1) * 2.5, this.ctx.currentTime, 0.2);
    }

    /** Filtered-noise sweep for shape changes. */
    whoosh() {
        if (!this.on || !this.ctx || !this.master) return;
        const ctx = this.ctx;
        const len = ctx.sampleRate * 1.4;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 2.2;
        const t = ctx.currentTime;
        bp.frequency.setValueAtTime(300, t);
        bp.frequency.exponentialRampToValueAtTime(2600, t + 0.35);
        bp.frequency.exponentialRampToValueAtTime(500, t + 1.3);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
        src.connect(bp).connect(g).connect(this.master);
        src.start(t);
    }

    tick(freq = 1800) {
        if (!this.on || !this.ctx || !this.master) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.value = freq;
        const t = this.ctx.currentTime;
        g.gain.setValueAtTime(0.04, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        o.connect(g).connect(this.ctx.destination);
        o.start(t);
        o.stop(t + 0.06);
    }
}

export const ambience = new Ambience();
