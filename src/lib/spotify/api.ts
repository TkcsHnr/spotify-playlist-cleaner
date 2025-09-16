import pLimit from "p-limit";

export function createSpotifyApi({ fetcher, getAccessToken, refreshAccessToken }: SpotifyApiOptions) {
    const BATCH_LIMIT = 50;
    const CONCURRENCY = 5;

    const spotifyFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
        const url = `https://api.spotify.com/v1${endpoint}`;

        const fetchWithToken = async (token: string) =>
            fetcher(url, {
                ...options,
                headers: {
                    ...(options.headers ?? {}),
                    Authorization: `Bearer ${token}`,
                },
            });

        let token = getAccessToken();
        if (!token) throw new Error('No access token available');

        let res = await fetchWithToken(token);

        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) return res;
            res = await fetchWithToken(newToken);
        }

        return res;
    };

    async function getUserProfile() {
        const res = await spotifyFetch("/me");
        if (!res.ok) throw new Error(`Failed to fetch users profile`);
        return (await res.json()) as SpotifyUserProfile;
    };

    async function getSavedTracksBatch(limit: number, offset: number) {
        const res = await spotifyFetch(`/me/tracks?limit=${limit}&offset=${offset}`);
        if (!res.ok) throw new Error(`Failed to fetch batch at offset ${offset}`);
        return await res.json() as TracksBatch;
    }

    async function* tracksGenerator(playlist_id: string) {
        const savedTracksCount = (await getSavedTracksBatch(1, 0)).total;
        const batchCount = Math.ceil(savedTracksCount / BATCH_LIMIT);
        const limit = pLimit(CONCURRENCY);

        const promises: Promise<{ batchIndex: number; tracks: Track[] }>[] = [];

        for (let i = 0; i < batchCount; i++) {
            const offset = i * BATCH_LIMIT;

            const p = limit(async () => {
                const batch = await getSavedTracksBatch(BATCH_LIMIT, offset);
                return { batchIndex: i, tracks: batch.items.flatMap(i => i.track) };
            });

            promises.push(p);
        }

        // Yield batches as they resolve
        while (promises.length > 0) {
            const finished = await Promise.race(promises.map(p => p.then(v => ({ v, p }))));
            yield finished.v.tracks;

            // remove finished promise
            promises.splice(promises.indexOf(finished.p), 1);
        }
    }

    async function getPlaylistsBatch(limit: number, offset: number) {
        const res = await spotifyFetch(`/me/playlists?limit=${limit}&offset=${offset}`);
        if (!res.ok) throw new Error(`Failed to fetch playlists`);
        return await res.json() as PlaylistsBatch;
    };

    async function getPlaylist(playlist_id: string) {
        const res = await spotifyFetch(`/playlists/${playlist_id}`);
        if (!res.ok) throw new Error('Failed to fatch playlist tracks');
        return await res.json() as Playlist;
    };

    async function transferPlayback(device_id: string) {
        const res = await spotifyFetch(`/me/player`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_ids: [device_id],
                play: false
            })
        });
        if (!res.ok) throw new Error(`Failed to transfer playback to device:${device_id}`);
    };

    async function setRepeatMode(state: "track" | "context" | "off", device_id: string) {
        console.log(`Setting repeat mode to ${state} on device:${device_id}`)
        const res = await spotifyFetch(`/me/player/repeat?state=${state}&device_id=${device_id}`, {
            method: 'PUT'
        })
        if (!res.ok) throw new Error(`Failed to set repeat mode to ${state} on device:${device_id}`);
    };

    function playTrack(device_id: string, track: Track) {
        console.log(`Playing ${track.name} on device:${device_id}`)
        spotifyFetch(`/me/player/play?device_id=${device_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uris: [track.uri]
            })
        }).then(res => {
            if (!res.ok) throw new Error(`Failed to play ${track.name} on device:${device_id}`);
        }).catch(err => {
            console.error(err);
        });
    };

    async function removeTrack(track: Track) {
        console.log(`Removing ${track.name}`);
        const res = await spotifyFetch(`/me/tracks?ids=${track.id}`, {
            method: 'DELETE'
        })
        if (!res.ok) throw new Error(`Failed to remove ${track.name}`);
    };

    return {
        getUserProfile,
        getSavedTracksBatch,
        tracksGenerator,
        getPlaylistsBatch,
        getPlaylist,
        transferPlayback,
        setRepeatMode,
        playTrack,
        removeTrack,
        spotifyFetch,
    };
}


