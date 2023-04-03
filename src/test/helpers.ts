export function omit<T extends object>(obj: T, ...keys: (keyof T)[]) {
    const newObj = { ...obj };
    for (const k of keys) {
        delete newObj[k];
    }
    return newObj;
}
