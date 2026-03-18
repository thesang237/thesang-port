import { cva } from 'class-variance-authority';

export enum TextVariant {
    //
}

export const textVariants = cva('', {
    variants: {
        variant: {} as Record<TextVariant, string>,
    },
});

const getFontSizeFromVariant = (_variant?: TextVariant) => undefined;
const getFontWeightFromVariant = (_variant?: TextVariant) => undefined;
const getLineHeightFromVariant = (_variant?: TextVariant) => undefined;
const getLetterSpacingFromVariant = (_variant?: TextVariant) => undefined;

export const buildTextStyles = ({ base, sm, md }: { base?: TextVariant; sm?: TextVariant; md?: TextVariant }) => {
    return {
        fontSize: {
            base: getFontSizeFromVariant(base),
            sm: getFontSizeFromVariant(sm),
            md: getFontSizeFromVariant(md),
        },
        fontWeight: {
            base: getFontWeightFromVariant(base),
            sm: getFontWeightFromVariant(sm),
            md: getFontWeightFromVariant(md),
        },
        lineHeight: {
            base: getLineHeightFromVariant(base),
            sm: getLineHeightFromVariant(sm),
            md: getLineHeightFromVariant(md),
        },
        letterSpacing: {
            base: getLetterSpacingFromVariant(base),
            sm: getLetterSpacingFromVariant(sm),
            md: getLetterSpacingFromVariant(md),
        },
    };
};
