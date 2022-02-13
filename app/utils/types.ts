// https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object
// Here Join concatenates two strings with a dot in the middle, unless the last string is empty. 
// So Join<"a","b.c"> is "a.b.c" while Join<"a",""> is "".
type Join<K, P> = K extends string ? P extends string ? (`${K}${"" extends P ? "" : "."}${P}`) : never : never;

// Extracts paths with dots from type
export type Paths<T, KEY> = T extends object ? {
    [K in keyof T]: K extends string ? (T[K] extends object ? Join<K, Paths<T[K], KEY>> : (T[K] extends KEY ? `${K}` : never))
    : never
}[keyof T] : never;

// Filter by field type
export type FilterTypeRecursive<T, E> = T extends object ? {
    [K in keyof T as T[K] extends E ? K : (T[K] extends object ? (object extends FilterTypeRecursive<T[K], E> ? never : K) : never)]: (T[K] extends object ? FilterTypeRecursive<T[K], E> : T[K])
} : never;

export type FilterNotTypeRecursive<T, E> = T extends object ? {
    [K in keyof T as T[K] extends E ? never : (T[K] extends object ? (object extends FilterNotTypeRecursive<T[K], E> ? never : K) : K)]: (T[K] extends object ? FilterNotTypeRecursive<T[K], E> : T[K])
} : never;

export type FilterType<T, E> = T extends object ? {
    [K in keyof T as T[K] extends E ? K : never]: T[K]
} : never;

export type FilterNotType<T, E> = T extends object ? {
    [K in keyof T as T[K] extends E ? never : K]: T[K]
} : never;

// Replace field type with another one
export type ReplaceTypeRecurcive<T, E, V> = T extends object ? {
    [K in keyof T]: (T[K] extends object ? ReplaceTypeRecurcive<T[K], E, V> : (T[K] extends E ? V : T[K]))
} : never;

// Add suffixes
export type AddSuffixes<T, SUFFIXES extends string> = T extends object
    ? (
        { [K in keyof T as T[K] extends object ? K : (K extends string ? `${K}${SUFFIXES}` : never)]: T[K] extends object ? AddSuffixes<T[K], SUFFIXES> : T[K] }
    )
    : never;

export type FlattenForIntellisense<T> = T extends object ? {} & { [P in keyof T]: FlattenForIntellisense<T[P]> } : T;