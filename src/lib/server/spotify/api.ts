import type { Cookies } from '@sveltejs/kit';
import { spotifyFetch } from './core';

export async function getUserProfile(locals: App.Locals, cookies: Cookies) {
    const res = await spotifyFetch("/me", locals, cookies);
    const userProfile = (await res.json()) as SpotifyUserProfile;

    return userProfile;
}