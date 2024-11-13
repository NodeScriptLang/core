export type FetchFunction = (req: FetchRequestSpec, body: any) => Promise<FetchResponseSpec>;

export enum FetchMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

export type FetchHeaders = Record<string, string | string[]>;

export interface FetchRequestSpec {
    url: string;
    method: FetchMethod;
    headers: FetchHeaders;
    proxy?: string;
    followRedirects?: boolean;
    timeout?: number;
    connectOptions?: Record<string, any>;
}

export interface FetchResponseSpec {
    status: number;
    headers: FetchHeaders;
    body: FetchResponseBody;
}

export interface FetchResponseBody {
    arrayBuffer(): Promise<ArrayBuffer>;
    json(): Promise<unknown>;
    text(): Promise<string>;
}
