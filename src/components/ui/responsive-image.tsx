import type { FC } from 'react';
import type { ImageProps } from 'next/image';

import PreloadImage from '@/components/ui/preload-image';
import QualityImage from '@/components/ui/quality-image';
import { Breakpoints } from '@/constants/breakpoints';
import type { StrapiImage } from '@/types/strapi';
import { getCmsAsset } from '@/utils/wrapper';
type Props = {
    laptop: StrapiImage;
    tablet?: StrapiImage;
    mobile?: StrapiImage;
    imageProps?: ImageProps;
    preload?: boolean;
};

const ResponsiveImage: FC<Props> = ({ laptop, tablet, mobile, imageProps, preload = false }) => {
    return (
        <picture>
            {mobile?.url && <source srcSet={getCmsAsset(mobile.url)} media={`(max-width: ${Breakpoints.MIN_TABLET}px)`} />}

            {tablet?.url && <source srcSet={getCmsAsset(tablet.url)} media={`(min-width: ${Breakpoints.MIN_TABLET}px) and (max-width: ${Breakpoints.MIN_LAPTOP - 1}px)`} />}

            {laptop.url && !preload && <QualityImage src={getCmsAsset(laptop.url)} alt={laptop.alternativeText ?? 'laptop'} fill {...imageProps} />}

            {laptop.url && preload && <PreloadImage src={getCmsAsset(laptop.url)} alt={laptop.alternativeText ?? 'laptop'} fill {...imageProps} />}
        </picture>
    );
};

export default ResponsiveImage;
