import type { FC } from 'react';
import type { ImageProps } from 'next/image';

import QualityImage from '@/components/ui/quality-image';

const SvgImage: FC<ImageProps> = ({ ...props }) => {
    return <QualityImage {...props} unoptimized />;
};

export default SvgImage;
