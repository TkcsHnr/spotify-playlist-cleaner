import { getCookie } from "$lib/utils";

// @ts-expect-error
let player: Spotify.Player | null = null;
let deviceId: string = '';

export function getPlayer() {
    return player;
}

export function getDeviceId() {
    return deviceId;
}

export async function activatePlayer() {
    if (player) {
        await player.activateElement();
        // const ctx = new AudioContext();
        // if (ctx.state === 'suspended') ctx.resume();
    }
}

export async function stopPlayer() {
    if (player) {
        try {
            await player.pause();
        } catch (err) {
            console.error('Failed to stop player', err);
        }
    }
}

export async function initPlayer() {
    if (player) {
        console.log("Player already initialized");
        return player;
    };

    console.log("Initializing web playback sdk");
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    return new Promise((resolve) => {
        (window as any).onSpotifyWebPlaybackSDKReady = async () => {
            // @ts-expect-error 
            player = new Spotify.Player({
                name: 'Spotify Web Playback SDK Playlist Cleaner',
                getOAuthToken: (cb: (token: string) => void) => cb(getCookie('access_token') || ''),
                volume: 1
            });

            const waitForReady = (): Promise<string> => {
                return new Promise((res, rej) => {
                    if (!player) return rej('Player not initialized');

                    const readyHandler = ({ device_id }: { device_id: string }) => {
                        deviceId = device_id;
                        res(device_id);
                    };

                    const errorHandler = ({ message }: { message: string }) => rej(message);

                    player.addListener('ready', readyHandler);
                    player.addListener('initialization_error', errorHandler);
                    player.addListener('authentication_error', errorHandler);
                    player.addListener('account_error', errorHandler);
                    player.addListener('autoplay_failed', () =>
                        console.log('Autoplay is not allowed by the browser autoplay rules')
                    );
                });
            };

            const initPlayerInstance = async () => {
                if (!player) return;
                const connected = await player.connect();
                if (!connected) return;
                try { await waitForReady(); } catch (err) { console.error(err); }
            };

            await initPlayerInstance();
            resolve(player);
        };
    });
}