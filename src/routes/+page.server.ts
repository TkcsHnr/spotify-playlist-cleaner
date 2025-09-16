import { refreshAccessToken } from '$lib/server/spotifyRefresh';
import { createSpotifyApi } from '$lib/spotify/api';
import type { PageServerLoad } from './$types';
import pLimit from 'p-limit';

const BATCH_LIMIT = 50;
const CONCURRENCY = 10;

export const load = (async ({ cookies, fetch, parent }) => {
    const layoutData = await parent();
    if (layoutData.userProfile === undefined) return;

    const spotifyApi = createSpotifyApi({
        fetcher: fetch,
        getAccessToken: () => cookies.get('access_token')!,
        refreshAccessToken: async () => await refreshAccessToken(cookies),
    });

    const playlistsCount = (await spotifyApi.getPlaylistsBatch(1, 0)).total;
    let plBatchCount = Math.ceil(playlistsCount / BATCH_LIMIT);
    let plLmit = pLimit(CONCURRENCY);
    const plRequests = Array.from({ length: plBatchCount }, (_, i) => {
        const offset = i * BATCH_LIMIT;
        return plLmit(() => spotifyApi.getPlaylistsBatch(BATCH_LIMIT, offset).then(b => b.items));
    });
    const plResults = await Promise.all(plRequests);
    const playlists = plResults.flat().filter(p => p.owner.id === layoutData.userProfile.id);

    return { playlists };
}) satisfies PageServerLoad;