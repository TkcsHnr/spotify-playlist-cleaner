import { refreshAccessToken } from '$lib/server/spotifyRefresh';
import type { Handle } from '@sveltejs/kit';

const skipPaths = ['/api/spotify/login', '/api/spotify/callback'];

export const handle: Handle = async ({ event, resolve }) => {
    if (skipPaths.some(p => event.url.pathname.startsWith(p))) {
        return resolve(event);
    }

    let accessToken = event.cookies.get('access_token');
    const refreshToken = event.cookies.get('refresh_token');

    if (accessToken === undefined && refreshToken !== undefined) {
        try {
            accessToken = await refreshAccessToken(refreshToken, event.cookies);
        } catch (err) {
            console.error('Failed to refresh token in hook', err);
            accessToken = undefined;
        }
    }

    event.locals.access_token = accessToken;
    event.locals.refresh_token = refreshToken;

    return resolve(event);
};
