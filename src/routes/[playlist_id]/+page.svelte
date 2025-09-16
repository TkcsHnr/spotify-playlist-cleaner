<script lang="ts">
	import { createSpotifyApi } from '$lib/spotify/api';
	import { stopPlayer, getDeviceId, activatePlayer, initPlayer } from '$lib/spotify/spotifyPlayer';
	import TrackCard from '$lib/TrackCard.svelte';
	import { getCookie, shuffle } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { playlistButtonPress } from '$lib/stores';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const spotifyApi = createSpotifyApi({
		fetcher: fetch,
		getAccessToken: () => getCookie('access_token'),
		refreshAccessToken: async () => {
			const res = await fetch('/api/spotify/refresh', { method: 'POST' });
			if (!res.ok) return undefined;
			return res.text();
		}
	});

	let shuffledTracks: Track[] = [];
	let currentTrack = $state<Track | undefined>();

	async function startFetching() {
		const generator = spotifyApi.tracksGenerator(data.playlist_id);

		for await (const batch of generator) {
			shuffledTracks = shuffle([...shuffledTracks, ...batch]);
			if (currentTrack === undefined && playbackEnabled) {
				playNext();
			}
		}
	}

	async function playNext() {
		let track = shuffledTracks.shift();
		if (track === undefined) return;

		currentTrack = track;
		if (data.premiumUser === false) return;
        
		await activatePlayer();
		spotifyApi.playTrack(getDeviceId(), track);
	}

	async function removeCurrent() {
		if (currentTrack === undefined) return;
		await spotifyApi.removeTrack(currentTrack);
		playNext();
	}

	async function handleKeyup(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			playNext();
		} else if (event.key === 'ArrowLeft') {
			await removeCurrent();
		}
	}

	let playbackEnabled = $state(false);

	onMount(() => {
		const unsubscribe = playlistButtonPress.subscribe((buttonPress) => {
			playbackEnabled = buttonPress;
		});
		unsubscribe();
		playlistButtonPress.set(false);
		startFetching();
	});

	onDestroy(async () => {
		await stopPlayer();
	});

	function enablePlayback() {
		playbackEnabled = true;
		playNext();
	}
</script>

<svelte:window onkeyup={handleKeyup} />

{#if playbackEnabled == false}
	<button class="btn btn-success btn-lg" onclick={enablePlayback}>Enable audio playback</button>
{:else if currentTrack !== undefined}
	<TrackCard track={currentTrack} />
	<div class="flex gap-4 flex-wrap justify-center w-full">
		<button class="btn btn-lg btn-error" onclick={removeCurrent}>Remove</button>
		<button class="btn btn-lg btn-success" onclick={playNext}>Keep</button>
	</div>
{/if}
