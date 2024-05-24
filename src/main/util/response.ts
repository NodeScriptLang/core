import { ResponseSpec, ResponseSpecSchema } from '../schema/ResponseSpec.js';

export function errorToResponse(error: any): ResponseSpec {
    return {
        status: Number(error?.status) || 500,
        headers: {
            'content-type': ['application/json'],
        },
        body: {
            name: error?.name ?? 'Error',
            message: error?.message ?? 'Unknown error',
            details: error?.details ?? undefined,
        },
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
        return ResponseSpecSchema.decode({
            ...value.$response,
            headers: {
                ...value.$response.headers,
            },
        });
    }
    // Default response (content-type should be inferred by the sender)
    return {
        status: 200,
        headers: {},
        body: value,
    };
}
