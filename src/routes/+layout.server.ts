import { refreshAccessToken } from '$lib/server/spotifyRefresh';
import { createSpotifyApi } from '$lib/spotify/api';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies, fetch }) => {
    if (cookies.get('access_token') === undefined) return;

    const spotifyApi = createSpotifyApi({
        fetcher: fetch,
        getAccessToken: () => cookies.get('access_token')!,
        refreshAccessToken: async () => await refreshAccessToken(cookies),
    });

    const userProfile = await spotifyApi.getUserProfile();

    return { userProfile }
}) satisfies LayoutServerLoad;
