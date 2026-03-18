'use client';

import type { FC, RefObject, VideoHTMLAttributes } from 'react';
import dynamic from 'next/dynamic';

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
    withPreload?: boolean;
    ref?: RefObject<HTMLVideoElement | null>;
};

const ReactHlsPlayer = dynamic(() => import('react-hls-player'), {
    ssr: false,
});

const HlsPlayer: FC<Props> = ({ ref, ...props }) => {
    return (
        <ReactHlsPlayer
            playerRef={ref as RefObject<HTMLVideoElement>}
            playsInline
            muted
            loop
            autoPlay={false}
            {...props}
            poster={props.poster}
            src={props.src as string}
            controls={props.controls ?? true}
            hlsConfig={{
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
                maxBufferSize: 60 * 1000 * 1000,
                maxBufferHole: 0.5,
                highBufferWatchdogPeriod: 2,
                nudgeOffset: 0.1,
                nudgeMaxRetry: 3,
                maxFragLookUpTolerance: 0.25,
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 10,
                liveDurationInfinity: true,
                liveBackBufferLength: null,
                maxLiveSyncPlaybackRate: 1,
            }}
        />
    );
};

export default HlsPlayer;
