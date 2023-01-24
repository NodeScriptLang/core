export type Equality<T> = (a: T, b: T) => boolean;

export function eqeqeq<T>(a: T, B: T) {
    return a === B;
}

export function seqStartsWith<T>(
    haystack: ArrayLike<T>,
    needle: ArrayLike<T>,
    eq: Equality<T> = eqeqeq
) {
    if (haystack.length < needle.length) {
        return false;
    }
    for (let i = 0; i < needle.length; i++) {
        if (!eq(haystack[i], needle[i])) {
            return false;
        }
    }
    return true;
}

export function seqEndsWith<T>(
    haystack: ArrayLike<T>,
    needle: ArrayLike<T>,
    eq: Equality<T> = eqeqeq
) {
    if (haystack.length < needle.length) {
        return false;
    }
    for (let i = 0; i < needle.length; i++) {
        const j = haystack.length - needle.length + i;
        if (!eq(haystack[j], needle[i])) {
            return false;
        }
    }
    return true;
}

export function seqContains<T>(
    haystack: ArrayLike<T>,
    needle: ArrayLike<T>,
    eq: Equality<T> = eqeqeq
) {
    let start = 0;
    while (start <= haystack.length - needle.length) {
        let match = true;
        for (let i = 0; i < needle.length; i++) {
            const hs = haystack[start + i];
            const nl = needle[i];
            if (!eq(hs, nl)) {
                match = false;
                start += 1;
                break;
            }
        }
        if (match) {
            return true;
        }
    }
    return false;
}
