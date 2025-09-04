// src/lib/server/spotify.js
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '$env/static/private';
import { error, type Cookies } from '@sveltejs/kit';

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

export async function refreshAccessToken(refreshToken: string, cookies: Cookies): Promise<string> {
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
            refresh_token: refreshToken
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

    if (newTokens.refresh_token) {
        cookies.set('refresh_token', newTokens.refresh_token, {
            httpOnly: true,
            secure: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });
    }

    return newTokens.access_token;
}
