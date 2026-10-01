import Image, { type ImageProps } from 'next/image';

import { BLUR } from './blur';

type Props = Omit<ImageProps, 'src' | 'width' | 'height' | 'placeholder' | 'blurDataURL' | 'alt'> & {
    src: string;
    alt?: string;
    /** required: how wide the image is rendered, so next/image picks the right variant */
    sizes: string;
};

/**
 * next/image with the intrinsic size + blur placeholder of our generated assets filled in.
 * Layout (object-fit, width/height, transforms) stays in CSS/`style`, as on the plain <img> before.
 */
export default function LnImage({ src, alt = '', sizes, ...rest }: Props) {
    const meta = BLUR[src];
    return <Image src={src} alt={alt} sizes={sizes} width={meta?.w ?? 1600} height={meta?.h ?? 1000} placeholder={meta ? 'blur' : 'empty'} blurDataURL={meta?.blur} {...rest} />;
}
