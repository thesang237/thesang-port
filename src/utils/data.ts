export const cloneDeep = <T>(data: T): T => JSON.parse(JSON.stringify(data)) as T;

export const getRandomElement = <T>(elements: T[] | string): T | string => {
    return elements[Math.floor(Math.random() * elements.length)];
};

export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    return keys.reduce(
        (acc, key) => {
            if (key in obj) acc[key] = obj[key];

            return acc;
        },
        {} as Pick<T, K>,
    );
};

export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);

    return result;
};

export const isEmpty = <T>(value: T): boolean => {
    if (typeof value === 'object' && value !== null) return Object.keys(value).length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (value instanceof File) return value.size === 0;

    return false;
};
