<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="navbar bg-base-200 shadow-sm">
	<div class="flex-1">
		<a class="btn btn-ghost text-xl" href="/">playlist-cleaner</a>
	</div>
	<div class="flex-none">
		{#if data.loggedIn}
			<form action="/api/spotify/logout" method="post">
				<input type="submit" class="btn btn-error" value="Log out" />
			</form>
		{:else}
			<a href="/api/spotify/login" class="btn btn-success">Log in</a>
		{/if}
	</div>
</div>

{@render children?.()}
