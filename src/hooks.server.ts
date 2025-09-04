import { refreshAccessToken } from '$lib/server/spotify';
import type { Handle } from '@sveltejs/kit';

const skipPaths = ['/api/spotify/login', '/api/spotify/callback'];

export const handle: Handle = async ({ event, resolve }) => {
    if (skipPaths.some(p => event.url.pathname.startsWith(p))) {
        return resolve(event);
    }

    event.locals.access_token = event.cookies.get('access_token');
    event.locals.refresh_token = event.cookies.get('refresh_token');

    if (event.locals.access_token === undefined && event.locals.refresh_token !== undefined) {
        try {
            await refreshAccessToken(event.locals, event.cookies);
        } catch (err) {
            console.error('Failed to refresh token in hook', err);
            event.locals.access_token = undefined;
        }
    }

    return resolve(event);
};
