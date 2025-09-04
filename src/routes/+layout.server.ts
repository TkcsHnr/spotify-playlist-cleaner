import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, cookies }) => {
    if (locals.access_token === undefined) return { loggedIn: false };

    return { loggedIn: true }
}) satisfies LayoutServerLoad;
