import { z } from 'zod';

// Filter operation types
const filterOperationSchema = z.enum([
    'eq', // equals
    'ne', // not equals
    'in', // in array
    'nin', // not in array
    'gt', // greater than
    'gte', // greater than or equal
    'lt', // less than
    'lte', // less than or equal
    'regex', // regex match
    'exists', // field exists
    'asc', // sort ascending
    'desc', // sort descending
]);

// Single sort/filter schema
const singleSortSchema = z.object({
    field: z.string().min(1, 'Field is required'),
    operation: filterOperationSchema,
    value: z.any().optional(), // Value for filter operations
});

// Multi-sort/filter schema
const multiSortSchema = z.array(singleSortSchema).min(1, 'At least one field is required');

export const paginationQuerySchema = z.object({
    search: z.string().optional(),
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val > 0, 'Page must be greater than 0')
        .optional(),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
        .optional(),
    filters: z
        .string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed : undefined;
            } catch {
                return undefined;
            }
        })
        .pipe(multiSortSchema.optional()),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SingleSort = z.infer<typeof singleSortSchema>;
