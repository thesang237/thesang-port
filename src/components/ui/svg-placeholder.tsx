import type { FC, HTMLAttributes } from 'react';
import type { ImageProps } from 'next/image';

import AllInOne from '@/components/ui/all-in-one';
import SvgImage from '@/components/ui/svg-image';

type Props = {
    wrapperProps?: HTMLAttributes<HTMLDivElement>;
    imageProps?: ImageProps;
};

const SvgPlaceholder: FC<Props> = ({ wrapperProps, imageProps }) => {
    return (
        <AllInOne className="relative" {...wrapperProps}>
            <SvgImage {...imageProps} src={imageProps?.src || `https://placehold.co/24x24`} alt={imageProps?.alt || 'placeholder'} fill />
        </AllInOne>
    );
};

export default SvgPlaceholder;
