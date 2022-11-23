export function capitalizeWords(str: string) {
    return str.replace(/\b([a-zA-Z])/g, (_, letter) => letter.toUpperCase());
}

export function humanize(str: string) {
    return capitalizeWords(str.replace(/[_-]?([A-Z]+)/g, ` $1`).trim());
}
