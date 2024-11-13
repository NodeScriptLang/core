import { FetchFunction, FetchRequestSpec } from '../types/index.js';
import { parseJson } from './json.js';

export const fetchRelay: FetchFunction = async (req: FetchRequestSpec, body?: any) => {
    const fetchServiceUrl = req.connectOptions?.fetchServiceUrl ?? 'https://fetch.nodescript.dev/request';
    const res = await fetch(fetchServiceUrl, {
        method: 'POST',
        headers: makeControlHeaders(req),
        body,
    });
    if (!res.ok) {
        const responseBodyText = await res.text();
        const message = (parseJson(responseBodyText, {})).message ?? responseBodyText;
        throw new FetchError(`Fetch failed: ${res.status} ${message}`);
    }
    const status = Number(res.headers.get('x-fetch-status')) || 0;
    const headers = parseJson(res.headers.get('x-fetch-headers') ?? '{}', {});
    return {
        status,
        headers,
        body: res,
    };
};

function makeControlHeaders(req: FetchRequestSpec): Record<string, string> {
    const headers: Record<string, string> = {
        'x-fetch-method': req.method,
        'x-fetch-url': req.url,
        'x-fetch-headers': JSON.stringify(req.headers),
        'x-fetch-connect-options': JSON.stringify(req.connectOptions ?? {}),
    };
    if (req.proxy) {
        headers['x-fetch-proxy'] = req.proxy.trim();
    }
    if (req.timeout != null) {
        headers['x-fetch-timeout'] = String(req.timeout);
    }
    return headers;
}

export class FetchError extends Error {

    override name = this.constructor.name;
    status = 500;
    details = {};

    constructor(message: string, code?: string) {
        super(message || code || 'Request failed');
        this.details = {
            code,
        };
        this.stack = '';
    }

}
