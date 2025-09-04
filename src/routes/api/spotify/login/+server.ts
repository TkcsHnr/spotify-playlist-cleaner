import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';
import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } from '$env/static/private';

const spotifyScopes = [
    "user-modify-playback-state",
    "user-read-playback-state",
    "user-read-currently-playing",
    "user-library-modify",
    "user-library-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public"
];

export const GET: RequestHandler = async ({ cookies }) => {
    const state = crypto.randomUUID();

    cookies.set('state', state, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/'
    });

    const url = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
    url.searchParams.set('scope', spotifyScopes.join(" "));
    url.searchParams.set('redirect_uri', SPOTIFY_REDIRECT_URI);
    url.searchParams.set('state', state);

    throw redirect(302, url.toString());
};