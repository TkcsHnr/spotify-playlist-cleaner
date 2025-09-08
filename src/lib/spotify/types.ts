// response object from spotify /api/token
interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

// partial user profile from spotify web api
interface SpotifyUserProfile {
    country: string;
    display_name: string;
    id: string;
    images: { url: string }[];
    product: string;
}

// partial album object from spotify web api
interface Album {
    id: string;
    images: { url: string }[];
    name: string;
}

// partial track object from spotify web api
interface Track {
    album: Album;
    artists: { name: string }[];
    duration_ms: number;
    id: string;
    name: string;
};

interface SpotifyApiOptions {
    fetcher: typeof fetch;
    getAccessToken: () => string | undefined;
    refreshAccessToken: () => Promise<string | undefined>;
}
