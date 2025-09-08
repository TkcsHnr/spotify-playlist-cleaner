import { refreshAccessToken } from '$lib/server/spotifyRefresh';
import type { Handle } from '@sveltejs/kit';

const skipPaths = ['/api/spotify/login', '/api/spotify/callback'];

export const handle: Handle = async ({ event, resolve }) => {
    if (skipPaths.some(p => event.url.pathname.startsWith(p))) {
        return resolve(event);
    }

    if (event.cookies.get("access_token") === undefined && event.cookies.get("refresh_token") !== undefined) {
        try {
            await refreshAccessToken(event.cookies);
        } catch (err) {
            console.error('Failed to refresh token in hook', err);
        }
    }

    return resolve(event);
};
