<script lang="ts">
	import { onMount } from 'svelte';
	import { getCookie } from './utils';

	let { onready }: { onready: () => void } = $props();

	// @ts-expect-error
	let player: Spotify.Player | null = null;

	let deviceId = '';
	export function getDeviceId() {
		return deviceId;
	}

	onMount(() => {
		if (getCookie('access_token') === undefined) return;
		const script = document.createElement('script');
		script.src = 'https://sdk.scdn.co/spotify-player.js';
		script.async = true;
		document.body.appendChild(script);

		(window as any).onSpotifyWebPlaybackSDKReady = () => {
			// @ts-expect-error
			player = new Spotify.Player({
				name: 'Spotify Web Playback SDK Playlist Cleaner',
				getOAuthToken: (cb: (token: string) => void) => cb(getCookie('access_token') || ''),
				volume: 0.5
			});

			player.addListener('initialization_error', ({ message }: { message: string }) =>
				console.error('Initialization error:', message)
			);
			player.addListener('authentication_error', ({ message }: { message: string }) =>
				console.error('Authentication error:', message)
			);
			player.addListener('account_error', ({ message }: { message: string }) =>
				console.error('Account error:', message)
			);
			player.addListener('playback_error', ({ message }: { message: string }) =>
				console.error('Playback error:', message)
			);

			player.addListener('ready', ({ device_id }: { device_id: string }) => {
				console.log('Ready with Device ID', device_id);
				deviceId = device_id;
				onready();
			});

			void player.connect();
		};
	});
</script>
