import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } from '$env/static/private';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const spotifyError = url.searchParams.get("error");
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");

    const cookieState = cookies.get('state');
    const code_verifier = cookies.get('code_verifier');
    cookies.delete('state', { path: '/' });
    cookies.delete('code_verifier', { path: '/' })

    if (state === null || cookieState === undefined || state !== cookieState) {
        throw error(400, 'Invalid state: possible CSRF attack');
    }
    if (code_verifier === undefined) {
        throw error(400, 'Code verifier not found');
    }
    if (spotifyError !== null) {
        throw error(400, `Spotify authorization error: ${spotifyError}`);
    }
    if (code === null) {
        throw error(400, 'Code not provided');
    }

    const formBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
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
        httpOnly: false,
        secure: true,
        path: '/',
        maxAge: expires_in
    });

    cookies.set('refresh_token', refresh_token, {
        httpOnly: true,
        secure: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    throw redirect(302, "/");
};