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
        },
        attributes: {},
    };
}

export function resultToResponse(value: any): ResponseSpec {
    // Empty body
    if (value == null) {
        return {
            status: 204,
            headers: {},
            body: '',
            attributes: {},
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
    // String response
    if (typeof value === 'string') {
        return {
            status: 200,
            headers: {
                'content-type': ['text/plain'],
            },
            body: value,
            attributes: {},
        };
    }
    // Default JSON response
    return {
        status: 200,
        headers: {
            'content-type': ['application/json'],
        },
        body: JSON.stringify(value),
        attributes: {},
    };
}
