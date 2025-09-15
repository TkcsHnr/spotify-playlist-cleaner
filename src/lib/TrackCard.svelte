<script lang="ts">
	let { track }: { track: Track | undefined } = $props();
</script>

<div
	class="card w-full max-w-sm rounded-[2rem] shadow-sm bg-base-200 border border-base-content/10"
>
	<figure class="px-[1.5rem] pt-[1.5rem]">
		{#if track}
			<img
				src={track.album.images[0].url}
				alt="Album cover"
				class="rounded-[0.5rem] aspect-square w-full bg-base-300"
			/>
		{:else}
			<div
				class="bg-base-300 w-full aspect-square rounded-[0.5rem] grid justify-center items-center text-base-content/75"
			>
				Album cover
			</div>
		{/if}
	</figure>
	<div class="card-body gap-0">
		<h2 class="card-title">{track ? track.name : 'Track name'}</h2>
		<p class="text-base-content/75">
			{track ? track.artists.map((a) => a.name).join(', ') : 'Artists'}
		</p>
	</div>
</div>
