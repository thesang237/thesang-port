'use client';

import type { FC } from 'react';
import type { HTMLMotionProps, Variants } from 'framer-motion';
import { motion } from 'framer-motion';

import { fadeInUp } from './variants';

type Props = HTMLMotionProps<'div'> & {
    variants?: Variants;
    once?: boolean;
    amount?: number;
};

const MotionDiv: FC<Props> = ({ variants = fadeInUp, once = true, amount = 0.2, initial = 'hidden', whileInView = 'visible', viewport, ...props }) => {
    return <motion.div initial={initial} whileInView={whileInView} viewport={{ once, amount, ...viewport }} variants={variants} {...props} />;
};

export default MotionDiv;
