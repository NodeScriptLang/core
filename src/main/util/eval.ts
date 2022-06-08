export async function evalEsmModule(code: string) {
    return await import(/* webpackIgnore: true */ codeToUrl(code));
}

export function codeToUrl(code: string) {
    return `data:text/javascript;base64,${btoa(code)}`;
}
