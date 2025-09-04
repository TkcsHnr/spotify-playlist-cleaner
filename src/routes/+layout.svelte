<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="navbar bg-base-200 shadow-sm h-fit">
	<div class="flex-1">
		<a class="btn btn-ghost text-xl" href="/">playlist-cleaner</a>
	</div>
	<div class="flex-none">
		{#if data.loggedIn}
			<div class="dropdown dropdown-end block">
				<button class="btn btn-circle p-1.5 size-12 btn-soft">
					<img
						src={data.userProfile?.images[0].url}
						alt="User profile"
						class="size-9 object-cover rounded-full"
					/>
				</button>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					tabindex="0"
					class="dropdown-content mt-2 bg-base-300 rounded-box border border-base-content/10"
				>
					<ul class="menu min-w-36">
						<li class="menu-title">{data.userProfile?.display_name}</li>
						<li>
							<form action="/api/spotify/logout" method="post" class="p-0 w-full">
								<input
									type="submit"
									value="Log out"
									class="px-3 py-1.5 cursor-pointer text-error"
								/>
							</form>
						</li>
					</ul>
				</div>
			</div>
		{:else}
			<a href="/api/spotify/login" class="btn btn-success">Log in</a>
		{/if}
	</div>
</div>

{@render children?.()}
