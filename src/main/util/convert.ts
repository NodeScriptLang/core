export function convertAuto(value: string) {
    switch (value) {
        case '':
            return '';
        case 'undefined':
            return undefined;
        case 'null':
            return null;
        case 'true':
            return true;
        case 'false':
            return false;
        case '{}':
            return {};
        case '[]':
            return [];
        default: {
            const num = Number(value);
            if (!isNaN(num)) {
                return num;
            }
            return value;
        }
    }
}
