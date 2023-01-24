export function parseJson(str: string, defaultValue: any = undefined): any {
    try {
        return JSON.parse(str);
    } catch (error) {
        return defaultValue;
    }
}
