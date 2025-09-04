import type { Actions, PageServerLoad } from './$types';
import { getLikedTracks } from '$lib/server/spotify'

export const load = (async ({ locals, cookies }) => {
    let access_token = locals.access_token;

    if (access_token === undefined) return {};

    getLikedTracks(locals, cookies);

    return {}
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async () => {

    }
};