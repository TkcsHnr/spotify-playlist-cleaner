export function createSpotifyApi({ fetcher, getAccessToken, refreshAccessToken }: SpotifyApiOptions) {
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

    return {
        getUserProfile: async () => {
            const res = await spotifyFetch("/me");
            const userProfile = (await res.json()) as SpotifyUserProfile;
            
            return userProfile;
        },

        getLikedTracksCount: async () => {
            const res = await spotifyFetch("/me/tracks?market=HU&limit=1");
            if (!res.ok) throw new Error("Failed to fetch total liked tracks");
            const { total } = await res.json();
            return total;
        },

        getLikedTracks: async (limit: number, offset: number) => {
            const res = await spotifyFetch(`/me/tracks?market=HU&limit=${limit}&offset=${offset}`);
            if (!res.ok) throw new Error(`Failed to fetch batch at offset ${offset}`);
            const data = await res.json();

            return data.items.map((item: any) => item.track) as Track[];
        },

        transferPlayback: async (device_id: string) => {
            const res = await spotifyFetch(`/me/player`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_ids: [device_id],
                    play: false
                })
            });
            if (!res.ok) throw new Error(`Failed to transfer playback to device:${device_id}`);
        },

        setVolume: async (volume_percent: number, device_id: string) => {
            console.log(`Setting volume to ${volume_percent} on device:${device_id}`)
            const res = await spotifyFetch(`/me/player/volume?volume_percent=${volume_percent}&device_id=${device_id}`, {
                method: 'PUT'
            })
            if (!res.ok) throw new Error(`Failed to set volume to ${volume_percent} on device:${device_id}`);
        },

        setRepeatMode: async (state: "track" | "context" | "off", device_id: string) => {
            console.log(`Setting repeat mode to ${state} on device:${device_id}`)
            const res = await spotifyFetch(`/me/player/repeat?state=${state}&device_id=${device_id}`, {
                method: 'PUT'
            })
            if (!res.ok) throw new Error(`Failed to set repeat mode to ${state} on device:${device_id}`);
        },

        playTrack: (device_id: string, trackId: string) => {
            console.log(`Playing track:${trackId} on device:${device_id}`)
            spotifyFetch(`/me/player/play?device_id=${device_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uris: [`spotify:track:${trackId}`]
                })
            }).then(res => {
                if (!res.ok) throw new Error(`Failed to play track:${trackId} on device:${device_id}`);
            }).catch(err => {
                console.error(err);
            });
        },

        removeTrack: async (trackId: string) => {
            console.log(`Removing track:${trackId}`);
            const res = await spotifyFetch(`/me/tracks?ids=${trackId}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error(`Failed to remove track:${trackId}`);
        },

        rawRequest: spotifyFetch,
    };
}


