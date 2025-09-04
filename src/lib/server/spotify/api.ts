import type { Cookies } from '@sveltejs/kit';
import { spotifyFetch } from './core';

export async function getLikedTracks(locals: App.Locals, cookies: Cookies, market = "HU", limit = 20, offset = 0) {
    let params = {
        market,
        limit: Math.max(1, Math.min(limit, 50)),
        offset
    };

    const res = await spotifyFetch("/me/tracks", locals, cookies, { params });
    const data = await res.json();

    const { items, next, previous, offset: currentOffset, limit: currentLimit, total } = data;

    return {

    }
}