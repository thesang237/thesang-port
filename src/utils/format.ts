export const timestampToDateTime = (timestamp: string | null, locales: Intl.LocalesArgument, config?: Intl.DateTimeFormatOptions) => {
    if (!timestamp) return '';

    return new Date(timestamp).toLocaleDateString(locales, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...config,
    });
};

type FormatPrefixedNumberParams = {
    length?: number;
    prefix?: string;
    suffix?: string;
};

export const padStart = (number: number, { length = 2, prefix = '0', suffix = '' }: FormatPrefixedNumberParams) => {
    return number.toString().padStart(length, prefix) + suffix;
};

export const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
    }).format(number);
};

export const formatCurrency = (number: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(number);
};

export const formatPercentage = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
    }).format(number);
};

export const toDate = (date?: string | Date) => {
    return date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
};

type FormatCompactNumberParams = {
    decimals?: number;
    minimumValue?: number;
};

export const formatCompactNumber = (number: number, { decimals = 1, minimumValue = 1000 }: FormatCompactNumberParams = {}): string => {
    const absNumber = Math.abs(number);
    const sign = number < 0 ? '-' : '';

    if (absNumber < minimumValue) {
        return sign + absNumber.toString();
    }

    if (absNumber >= 1_000_000_000_000) {
        const value = absNumber / 1_000_000_000_000;
        return sign + value.toFixed(decimals) + 'T';
    }

    if (absNumber >= 1_000_000_000) {
        const value = absNumber / 1_000_000_000;
        return sign + value.toFixed(decimals) + 'B';
    }

    if (absNumber >= 1_000_000) {
        const value = absNumber / 1_000_000;
        return sign + value.toFixed(decimals) + 'M';
    }

    if (absNumber >= 1_000) {
        const value = absNumber / 1_000;
        return sign + value.toFixed(decimals) + 'k';
    }

    return sign + absNumber.toString();
};
