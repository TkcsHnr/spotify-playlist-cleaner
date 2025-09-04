import { getUserProfile } from '$lib/server/spotify';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, cookies }) => {
    if (locals.access_token === undefined) return { loggedIn: false };

    const userProfile = await getUserProfile(locals, cookies);

    return { loggedIn: true, userProfile }
}) satisfies LayoutServerLoad;
