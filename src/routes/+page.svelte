<script lang="ts">
	import { getCookie } from '$lib/utils';
	import { createSpotifyApi } from '$lib/spotify/api';
	import TrackCard from '$lib/TrackCard.svelte';
	import { onMount } from 'svelte';

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
		if (data.userProfile?.product !== 'premium') return;

		const script = document.createElement('script');
		script.src = 'https://sdk.scdn.co/spotify-player.js';
		script.async = true;
		document.body.appendChild(script);

		(window as any).onSpotifyWebPlaybackSDKReady = async () => {
			// @ts-expect-error
			player = new Spotify.Player({
				name: 'Spotify Web Playback SDK Playlist Cleaner',
				getOAuthToken: (cb: (token: string) => void) => cb(getCookie('access_token') || ''),
				volume: 1
			});

			const waitForReady = (): Promise<string> => {
				return new Promise((resolve, reject) => {
					if (!player) return reject('Player not initialized');

					const readyHandler = ({ device_id }: { device_id: string }) => {
						console.log('Ready with Device ID', device_id);

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
					player.addListener('autoplay_failed', () => {
						console.log('Autoplay is not allowed by the browser autoplay rules');
					});
				});
			};

			const initPlayer = async () => {
				if (!player) return;

				const connected = await player.connect();
				if (!connected) return;

				try {
					deviceId = await waitForReady();
				} catch (error) {
					console.error('Error initializing player:', error);
				}
			};

			await initPlayer();
		};
	});

	let trackCard = $state<TrackCard | undefined>();

	const randomTracks: Track[] = shuffle(data.likedTracks || []);
	let currentTrack = $state<Track | undefined>();
	function playNext() {
		let track = randomTracks.shift();
		if (deviceId === '' || track === undefined) return;

		if (data.userProfile?.product === 'premium') {
			player.activateElement();
		}
		try {
			spotifyApi.playTrack(deviceId, track.id);
		} catch (error) {
			return;
		}
		currentTrack = track;
	}

	async function removeCurrent() {
		if (currentTrack === undefined) return;
		await spotifyApi.removeTrack(currentTrack.id);
		playNext();
	}

	async function handleKeyup(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			playNext();
		} else if (event.key === 'ArrowLeft') {
			await removeCurrent();
		}
	}
</script>

<svelte:window onkeyup={handleKeyup} />

{#if data.userProfile}
	{#if currentTrack === undefined}
		<button class="btn size-32 btn-info text-7xl" onclick={playNext}> ♥ </button>
	{:else}
		<TrackCard track={currentTrack} bind:this={trackCard} />
		<div class="flex gap-4 flex-wrap justify-center w-full">
			<button class="btn btn-lg btn-error" onclick={removeCurrent}>Remove</button>
			<button class="btn btn-lg btn-success" onclick={playNext}>Keep</button>
		</div>
	{/if}
{/if}
