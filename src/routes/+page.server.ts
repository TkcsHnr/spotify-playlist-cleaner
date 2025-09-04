import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
    if (!locals.access_token) return { loggedIn: false };

    return { loggedIn: true }
};