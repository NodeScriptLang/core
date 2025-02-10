import { ResponseSpec, ResponseSpecSchema } from '../schema/ResponseSpec.js';

export function errorToResponse(error: any): ResponseSpec {
    const isFetchFailed = error.name === 'TypeError' && error.message === 'fetch failed';
    const isUnknown = !error?.name && !error?.message;
    const body = isFetchFailed || isUnknown ? createWrappedErrorBody(error) : createErrorBody(error);

    return {
        status: Number(error?.status) || 500,
        headers: {
            'content-type': ['application/json'],
        },
        body,
    };
}

export function resultToResponse(value: any): ResponseSpec {
    // Empty body
    if (value == null) {
        return {
            status: 204,
            headers: {},
            body: '',
        };
    }
    // Explicit response
    if (value && value.$response) {
        return ResponseSpecSchema.decode(value.$response);
    }
    // Default response (content-type should be inferred by the sender)
    return {
        status: 200,
        headers: {},
        body: value,
    };
}

function createErrorBody(error: any) {
    return {
        name: error?.name ?? 'Error',
        message: error?.message ?? 'Unknown error',
        details: error?.details ?? undefined,
    };
}

function createWrappedErrorBody(error: any) {
    return {
        name: 'ServerError',
        message: 'The target server failed to complete the request.',
        details: createErrorBody(error)
    };
}
