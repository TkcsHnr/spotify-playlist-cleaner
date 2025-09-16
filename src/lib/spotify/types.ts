// response object from spotify /api/token
interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

// partial image object from spotify web api
interface SpotifyImage {
    url: string;
}

// partial user profile from spotify web api
interface SpotifyUserProfile {
    country: string;
    display_name: string;
    id: string;
    images: SpotifyImage[];
    product: string;
}

// partial album object from spotify web api
interface Album {
    id: string;
    images: SpotifyImage[];
    name: string;
}

// partial track object from spotify web api
interface Track {
    album: Album;
    artists: { name: string }[];
    id: string;
    uri: string;
    name: string;
};

// partial tracks object from spotify web api
interface TracksBatch {
    total: number;
    items: { track: Track; }[]
}

// partial playlist tracks objects from spotify web api
interface Playlist {
    name: string;
    owner: {
        id: string;
    }
    description: string | null;
    id: string;
    images: SpotifyImage[];
    tracks: TracksBatch;
}

interface PlaylistsBatch {
    total: number;
    items: Playlist[];                                                                                                                                                                                                                                                                                                                                                                                                                          
}

interface SpotifyApiOptions {
    fetcher: typeof fetch;
    getAccessToken: () => string | undefined;
    refreshAccessToken: () => Promise<string | undefined>;
}
