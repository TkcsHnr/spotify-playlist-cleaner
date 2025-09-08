import type { Cookies } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '$env/static/private';

export async function refreshAccessToken(cookies: Cookies) {
    const refresh_token = cookies.get("refresh_token");
    if (refresh_token === undefined) {
        throw error(500, "No refresh token found");
    };

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
            refresh_token
        })
    });
    if (!res.ok) throw error(res.status, 'Failed to refresh Spotify token');

    const newTokens: SpotifyTokenResponse = await res.json();

    cookies.set('access_token', newTokens.access_token, {
        httpOnly: false,
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