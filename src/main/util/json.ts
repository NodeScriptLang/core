export function parseJson(str: string, defaultValue: any = undefined): any {
    try {
        return JSON.parse(str);
    } catch (_err) {
        return defaultValue;
    }
}
