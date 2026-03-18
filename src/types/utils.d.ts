type ExtractKey<T> = keyof T;
type ExtractValue<T> = T[ExtractKey<T>];
type ObjectEntries<T> = {
    [K in ExtractKey<T>]: [K, ExtractValue<T>];
}[ExtractKey<T>];
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;
