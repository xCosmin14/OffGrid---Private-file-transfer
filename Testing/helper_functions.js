export async function getResponse(endpoint, method, body = null, cookie = null, content_type = "application/json") {
    let isFormData = body instanceof FormData;

    let response = await fetch(`http://localhost:18080${endpoint}`, {
        method: method,
        headers: {
            ...(!isFormData && { 'Content-Type': content_type }),
            ...(cookie && { 'Cookie': cookie })
        },
        credentials: 'include',
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
    });

    return response;
}

export function extractCookie(cookie) {
    return cookie.split(";")[0];
}