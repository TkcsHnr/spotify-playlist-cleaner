import type { PageServerLoad } from './$types';


export const load = (async ({ params }) => {
    const playlist_id = params.playlist_id;

    return { playlist_id };
}) satisfies PageServerLoad;