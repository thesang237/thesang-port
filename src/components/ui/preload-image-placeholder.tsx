'use client';

import type { FC, HTMLAttributes } from 'react';
import type { ImageProps } from 'next/image';

import AllInOne from '@/components/ui/all-in-one';
import PreloadImage from '@/components/ui/preload-image';

type Props = {
    wrapperProps?: HTMLAttributes<HTMLDivElement>;
    imageProps?: ImageProps;
};

const PreloadImagePlaceholder: FC<Props> = ({ wrapperProps, imageProps }) => {
    return (
        <AllInOne className="relative overflow-hidden rounded-[inherit]" {...wrapperProps}>
            <PreloadImage {...imageProps} src={imageProps?.src || `https://placehold.co/1920x1080`} alt={imageProps?.alt || 'placeholder'} fill />
        </AllInOne>
    );
};

export default PreloadImagePlaceholder;
