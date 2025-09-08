import { refreshAccessToken } from '$lib/server/spotifyRefresh';
import { createSpotifyApi } from '$lib/spotify/api';
import type { PageServerLoad } from './$types';
import pLimit from 'p-limit';

const BATCH_LIMIT = 50;
const CONCURRENCY = 10;

export const load = (async ({ cookies, fetch }) => {
    if (cookies.get('access_token') === undefined) return;

    const spotifyApi = createSpotifyApi({
        fetcher: fetch,
        getAccessToken: () => cookies.get('access_token')!,
        refreshAccessToken: async () => await refreshAccessToken(cookies),
    });

    const likedTracksCount = await spotifyApi.getLikedTracksCount();
    const batchCount = Math.ceil(likedTracksCount / BATCH_LIMIT);
    const limit = pLimit(CONCURRENCY);

    const requests = Array.from({ length: batchCount }, (_, i) => {
        const offset = i * BATCH_LIMIT;
        return limit(() => spotifyApi.getLikedTracks(BATCH_LIMIT, offset));
    });

    const results = await Promise.all(requests);
    const likedTracks = results.flat();

    return { likedTracksCount, likedTracks };
}) satisfies PageServerLoad;