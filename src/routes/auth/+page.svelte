<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import SignUpForm from '$lib/components/auth/SignUpForm.svelte';

	let showSignUp = false;
</script>

<div
	class="flex h-screen w-screen flex-col items-center justify-center bg-[#1a1a1a] font-sans text-white"
>
	<div class="w-full max-w-md rounded-lg bg-[#2a2a2a] p-8 shadow-lg">
		<h1 class="mb-8 text-center text-3xl font-bold">Welcome to Threlte Chess</h1>

		{#if showSignUp}
			<SignUpForm />
			<div class="mt-4 text-center">
				<button
					class="text-[#2196F3] transition-colors hover:text-[#1976D2]"
					on:click={() => (showSignUp = false)}
				>
					Already have an account? Log in
				</button>
			</div>
		{:else}
			<LoginForm />
			<div class="mt-4 text-center">
				<button
					class="text-[#2196F3] transition-colors hover:text-[#1976D2]"
					on:click={() => (showSignUp = true)}
				>
					Don't have an account? Sign up
				</button>
			</div>
		{/if}
	</div>
</div>
