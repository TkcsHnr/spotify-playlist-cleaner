<script lang="ts">
	import SpotifyWebPlayer from '$lib/SpotifyWebPlayer.svelte';
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
	let webPlayer = $state<SpotifyWebPlayer | undefined>();
	let trackCard = $state<TrackCard | undefined>();

	const randomTracks: Track[] = shuffle(data.likedTracks || []);
	let currentTrack = $state<Track | undefined>();
	async function playNext() {
		currentTrack = randomTracks.shift();
		if (webPlayer === undefined || currentTrack === undefined) return;
		try {
			await spotifyApi.playTrack(webPlayer.getDeviceId(), currentTrack.id);
		} catch (error) {
			playNext();
			return;
		}

		await spotifyApi.setRepeatMode('track', webPlayer.getDeviceId());
		trackCard?.restartTimer();
	}

	async function removeCurrent() {
		if (currentTrack === undefined) return;
		await spotifyApi.removeTrack(currentTrack.id);
		playNext();
	}

	async function startPlayer() {
		if (webPlayer === undefined) {
			console.log('WebPlayer is undefined, cannot start playback');
			return;
		}
		await spotifyApi.transferPlayback(webPlayer.getDeviceId());
		await spotifyApi.setVolume(100, webPlayer.getDeviceId());
		await playNext();
	}
</script>

{#if data.userProfile}
	<SpotifyWebPlayer bind:this={webPlayer} onready={() => {}} />
	<TrackCard track={currentTrack} bind:this={trackCard} />
	<div class="flex gap-4">
		<button class="btn btn-lg btn-info" onclick={startPlayer}>Start</button>
		<button class="btn btn-lg btn-error" onclick={removeCurrent}>Remove</button>
		<button class="btn btn-lg btn-success" onclick={playNext}>Keep</button>
	</div>
{/if}
