import type { RequestHandler } from "./$types";
import { refreshAccessToken } from "$lib/server/spotifyRefresh";

export const POST: RequestHandler = async ({ cookies }) => {
    const access_token = await refreshAccessToken(cookies);

    return new Response(access_token, { status: 200 });
};
