const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi(endpoint: string, options: RequestInit = {}) {
    let token;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
    }

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && typeof window !== 'undefined' && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
        body = JSON.stringify(body);
    }

    const config: RequestInit = {
        ...options,
        headers,
        body: body as BodyInit,
    };

    const response = await fetch(`${baseURL}${endpoint}`, config);

    let data;
    try {
        data = await response.json();
    } catch (err) {
        data = null;
    }

    if (!response.ok) {
        throw data || new Error('Request failed');
    }

    return data;
}

export const api = {
    get: (url: string) => fetchApi(url, { method: 'GET' }),
    post: (url: string, data?: any) => fetchApi(url, { method: 'POST', body: data }),
    patch: (url: string, data?: any) => fetchApi(url, { method: 'PATCH', body: data }),
    delete: (url: string) => fetchApi(url, { method: 'DELETE' }),
};
