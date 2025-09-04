// src/lib/server/spotifyFetch.ts
import type { Cookies } from '@sveltejs/kit'; 
import { refreshAccessToken } from './spotifyRefresh';

export async function spotifyFetch(
    url: string,
    locals: App.Locals,
    cookies: Cookies,
    options: RequestInit = {}
): Promise<Response> {
    let token = locals.access_token;

    let res = await fetch(url, {
        ...options,
        headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
        const refreshToken = cookies.get('refresh_token');
        if (!refreshToken) return res;

        token = await refreshAccessToken(refreshToken, cookies);
        locals.access_token = token;

        res = await fetch(url, {
            ...options,
            headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` }
        });
    }

    return res;
}
