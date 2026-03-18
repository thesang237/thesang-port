import type { z } from 'zod';

export type FieldErrorMapReturn<T> = Partial<Record<keyof T, string>>;

export const getFieldErrorMap = <T>(fieldErrors: z.ZodError<T>): FieldErrorMapReturn<T> => {
    if (!fieldErrors) return {};

    return fieldErrors.issues.reduce<FieldErrorMapReturn<T>>((acc, issue) => {
        acc[issue.path[0] as keyof T] = issue.message;
        return acc;
    }, {});
};
