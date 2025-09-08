<script lang="ts">
	let { track }: { track: Track | undefined } = $props();

	let elapsed = $state(0);
	let start = 0;
	let animationFrame: number;

	export function restartTimer() {
		cancelAnimationFrame(animationFrame);
		start = performance.now();
		elapsed = 0;
		update();
	}

	function update() {
		elapsed = performance.now() - start;
		animationFrame = requestAnimationFrame(update);
	}
</script>

{#if track}
	<div
		class="card w-full max-w-sm rounded-[2rem] shadow-sm bg-base-200 border border-base-content/10"
	>
		<figure class="px-[1.5rem] pt-[1.5rem]">
			<img src={track.album.images[0].url} alt="Album cover" class="rounded-[0.5rem]" />
		</figure>
		<div class="card-body gap-0">
			<h2 class="card-title">{track.name}</h2>
			<p class="text-base-content/75">
				{track.artists.map((a) => a.name).join(', ')}
			</p>
			<progress class="progress w-full mt-4" value={elapsed} max={track.duration_ms}></progress>
		</div>
	</div>
{/if}
