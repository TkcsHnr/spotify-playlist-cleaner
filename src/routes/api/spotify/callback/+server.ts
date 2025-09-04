import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } from '$env/static/private';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const cookieState = cookies.get('state');
    cookies.delete('state', { path: "/" });

    const state = url.searchParams.get("state");
    if (state === null || cookieState === undefined || state !== cookieState) {
        cookies.delete('state', { path: "/" });
        throw error(400, 'Invalid state: possible CSRF attack');
    }

    const spotifyError = url.searchParams.get("error");
    if (spotifyError !== null) {
        throw error(400, `Spotify authorization error: ${spotifyError}`);
    }

    const code = url.searchParams.get("code");
    if (code === null) {
        throw error(400, 'Code not provided');
    }

    const formBody = new URLSearchParams({
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code'
    });

    const authHeader = 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
        },
        body: formBody.toString()
    });

    if (!response.ok) {
        const err = await response.json();
        throw error(response.status, err.error_description || 'Spotify token request failed');
    }

    const data = await response.json();
    const { access_token, refresh_token, expires_in } = await data;

    cookies.set('access_token', access_token, {
        httpOnly: true,
        secure: true,
        path: '/',
        maxAge: expires_in,
        sameSite: 'lax'
    });

    cookies.set('refresh_token', refresh_token, {
        httpOnly: true,
        secure: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
    });

    throw redirect(302, "/");
};