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
    "playlist-modify-public",
    "streaming",
    "user-read-email",
    "user-read-private"
];

const generateRandomString = (length: number) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input: ArrayBufferLike) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export const GET: RequestHandler = async ({ cookies }) => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed);
    const state = generateRandomString(16);

    cookies.set('code_verifier', codeVerifier, {
        secure: true,
        path: '/'
    });
    cookies.set('state', state, {
        secure: true,
        path: '/'
    });

    const url = new URL('https://accounts.spotify.com/authorize');
    const params = {
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: spotifyScopes.join(" "),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        state
    }
    url.search = new URLSearchParams(params).toString();

    throw redirect(302, url.toString());
};