<script lang="ts">
	import { getCookie } from '$lib/utils';
	import { createSpotifyApi } from '$lib/spotify/api';
	import TrackCard from '$lib/TrackCard.svelte';
	import { onMount } from 'svelte';

	let logs = $state<string[]>([]);

	const originalConsoleLog = console.log;

	console.log = function (...args) {
		logs.push(
			args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
		);

		originalConsoleLog.apply(console, args);
	};

	let { data } = $props();

	function shuffle(array: any[]) {
		// Fisher-Yates shuffle
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	const spotifyApi = createSpotifyApi({
		fetcher: fetch,
		getAccessToken: () => getCookie('access_token'),
		refreshAccessToken: async () => {
			const res = await fetch('/api/spotify/refresh', { method: 'POST' });
			if (!res.ok) return undefined;
			return res.text();
		}
	});
	// @ts-expect-error
	let player: Spotify.Player | null = null;
	let deviceId = $state('');
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
			player.addListener('autoplay_failed', () => {
				console.log('Autoplay is not allowed by the browser autoplay rules');
			});

			player.addListener('ready', ({ device_id }: { device_id: string }) => {
				console.log('Ready with Device ID', device_id);
				deviceId = device_id;

				const ctx = new AudioContext();
				if (ctx.state === 'suspended') ctx.resume();
			});
		};
	});

	function waitForReady(): Promise<string> {
		return new Promise((resolve, reject) => {
			if (player === null) return reject('Player not initialized');

			const readyHandler = ({ device_id }: { device_id: string }) => {
				const ctx = new AudioContext();
				if (ctx.state === 'suspended') ctx.resume();

				resolve(device_id);
			};

			const errorHandler = ({ message }: { message: string }) => {
				reject(message);
			};

			player.addListener('ready', readyHandler);
			player.addListener('initialization_error', errorHandler);
			player.addListener('authentication_error', errorHandler);
			player.addListener('account_error', errorHandler);
		});
	}

	async function initPlayer() {
		if (player === null) return;

		const connected = await player.connect();
		if (!connected) return;

		try {
			deviceId = await waitForReady();

			// await spotifyApi.transferPlayback(deviceId);
			// await spotifyApi.setVolume(100, deviceId);
			// await playNext();
		} catch (error) {
			console.error('Error initializing player:', error);
		}
	}

	let trackCard = $state<TrackCard | undefined>();

	const randomTracks: Track[] = shuffle(data.likedTracks || []);
	let currentTrack = $state<Track | undefined>();
	async function playNext() {
		let track = randomTracks.shift();
		if (deviceId === '' || track === undefined) return;
		try {
			await spotifyApi.playTrack(deviceId, track.id);
		} catch (error) {
			return;
		}
		currentTrack = track;
		await spotifyApi.setRepeatMode('track', deviceId);
		trackCard?.restartTimer();
	}

	async function removeCurrent() {
		if (currentTrack === undefined) return;
		await spotifyApi.removeTrack(currentTrack.id);
		playNext();
	}

	async function handleKeyup(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			await playNext();
		} else if (event.key === 'ArrowLeft') {
			await removeCurrent();
		}
	}
</script>

<svelte:window onkeyup={handleKeyup} />



{#if data.userProfile}
	<TrackCard track={currentTrack} bind:this={trackCard} />
	<div class="flex gap-4 flex-wrap justify-center">
		{#if deviceId === ''}
			<button class="btn btn-lg btn-info" onclick={initPlayer}>Connect</button>
		{:else if currentTrack === undefined}
			<button class="btn btn-lg btn-info" onclick={playNext}>Start</button>
		{:else}
			<button class="btn btn-lg btn-error" onclick={removeCurrent}>Remove</button>
			<button class="btn btn-lg btn-success" onclick={playNext}>Keep</button>
		{/if}
	</div>
{/if}

<div class="flex flex-col gap-2 text-sm">
	{#each logs as log}
		<p>{log}</p>
	{/each}
</div>