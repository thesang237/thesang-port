import type { FC } from 'react';
import type { ImageProps } from 'next/image';
import Image from 'next/image';

const QualityImage: FC<ImageProps> = ({ ...props }) => {
    return <Image quality={100} {...props} sizes={props.sizes || '100%'} />;
};

export default QualityImage;
