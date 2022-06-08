export function capitalizeWords(str: string) {
    return str.replace(/\b([a-zA-Z])/g, (_, letter) => letter.toUpperCase());
}

export function humanize(str: string) {
    return capitalizeWords(str.replace(/([A-Z])/g, ` $1`).trim());
}
