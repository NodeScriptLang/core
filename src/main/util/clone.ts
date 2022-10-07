export function clone<T>(data: T): T {
    return data == null ? null : JSON.parse(JSON.stringify(data));
}
