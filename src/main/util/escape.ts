/**
 * Evaluates the following escape sequences:
 *
 * \n, \r, \t, \\, \xXX, \uXXXX, \u{XXXXXX}
 */
export function evaluateEscapes(str: string) {
    return str
        .replace(/\\(n|r|t|x[0-9a-f]{2}|u[0-9a-f]{4}|u\{[0-9a-f]{1,6}\}|\\)/gi, (_, match) => {
            switch (match) {
                case 'n': return '\n';
                case 'r': return '\r';
                case 't': return '\t';
                case '\\': return '\\';
                default: {
                    const code = parseInt(match.replace(/[^0-9a-f]/gi, ''), 16);
                    return String.fromCharCode(code);
                }
            }
        });
}
