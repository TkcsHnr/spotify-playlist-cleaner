interface SpotifyFetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

interface SpotifyUserProfile {
    country: string;
    display_name: string;
    id: string;
    images: { url: string }[];
    product: string;
}