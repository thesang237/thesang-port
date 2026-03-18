export const nonEmptyElement = <T>(array: T[]): NonNullable<T>[] => array.filter(Boolean) as NonNullable<T>[];

export const arrayOrElement = <T>(array?: T | T[]): T[] => nonEmptyElement(Array.isArray(array) ? array : [array]);

export const chunk = <T>(array: T[], size: number): T[][] => {
    return array.reduce((acc, _, i) => {
        if (i % size === 0) {
            acc.push(array.slice(i, i + size));
        }

        return acc;
    }, [] as T[][]);
};

export const shuffle = <T>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};
