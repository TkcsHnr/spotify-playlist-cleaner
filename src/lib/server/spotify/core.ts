import type { Cookies } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '$env/static/private';

interface SpotifyFetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

export async function spotifyFetch(
    endpoint: string,
    locals: App.Locals,
    cookies: Cookies,
    options: SpotifyFetchOptions = {}
): Promise<Response> {
    const { params, ...fetchOptions } = options;

    const url = new URL(`https://api.spotify.com/v1${endpoint}`);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }
    }

    let res = await fetch(url.toString(), {
        ...fetchOptions,
        headers: { ...(fetchOptions.headers ?? {}), Authorization: `Bearer ${locals.access_token}` }
    });

    if (res.status === 401) {
        if (locals.refresh_token === undefined) return res;

        await refreshAccessToken(locals, cookies);

        res = await fetch(url, {
            ...fetchOptions,
            headers: { ...(fetchOptions.headers ?? {}), Authorization: `Bearer ${locals.access_token}` }
        });
    }

    return res;
}

export async function refreshAccessToken(locals: App.Locals, cookies: Cookies) {
    if (locals.refresh_token === undefined) return;

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization:
                'Basic ' +
                Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: locals.refresh_token
        })
    });

    if (!res.ok) throw error(res.status, 'Failed to refresh Spotify token');

    const newTokens: SpotifyTokenResponse = await res.json();

    cookies.set('access_token', newTokens.access_token, {
        httpOnly: true,
        secure: true,
        path: '/',
        maxAge: newTokens.expires_in
    });
    locals.access_token = newTokens.access_token;

    if (newTokens.refresh_token) {
        cookies.set('refresh_token', newTokens.refresh_token, {
            httpOnly: true,
            secure: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });
        locals.refresh_token = newTokens.refresh_token;
    }

}