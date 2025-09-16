<script lang="ts">
	import { activatePlayer, getDeviceId, initPlayer } from '$lib/spotify/spotifyPlayer.js';
	import { goto } from '$app/navigation';
	import { playlistButtonPress } from '$lib/stores.js';

	let { data } = $props();

	async function startPlaylist(playlist_id: string) {
		if (data.userProfile?.product === 'premium') {
			await initPlayer();
			await activatePlayer();
		}

		playlistButtonPress.set(true);
		goto(`/${playlist_id}`);
	}
</script>

{#if data.playlists}
	<div class="grid grid-cols-1 sm:grid-cols-2 justify-center items-center w-full max-w-2xl gap-2">
		<div class="join w-full h-12">
			<figure
				class="join-item h-full aspect-square grid justify-center items-center bg-info text-info-content text-2xl cursor-default"
			>
				♥
			</figure>
			<button
				class="join-item btn btn-soft min-h-full h-full justify-start grow"
				onclick={() => startPlaylist('saved_tracks')}
			>
				Saved tracks
			</button>
		</div>
		{#each data.playlists as playlist}
			<div class="join w-full h-12">
				<figure class="join-item h-full aspect-square bg-base-300 cursor-default overflow-hidden">
					{#if playlist.images?.[0]?.url}
						<img src={playlist.images?.[0]?.url} alt="playlist cover" />
					{/if}
				</figure>
				<button
					class="join-item btn btn-soft min-h-full h-full justify-start grow"
					onclick={() => startPlaylist(playlist.id)}
				>
					{playlist.name}
				</button>
			</div>
		{/each}
	</div>
{/if}
