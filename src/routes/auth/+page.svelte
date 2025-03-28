<script lang="ts">
    import LoginForm from '$lib/components/auth/LoginForm.svelte';
    import SignUpForm from '$lib/components/auth/SignUpForm.svelte';

    let showSignUp = false;
</script>

<div class="w-screen h-screen flex flex-col justify-center items-center bg-[#1a1a1a] text-white font-sans">
    <div class="w-full max-w-md p-8 bg-[#2a2a2a] rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold mb-8 text-center">Welcome to Threlte Chess</h1>
        
        {#if showSignUp}
            <SignUpForm />
            <div class="mt-4 text-center">
                <button 
                    class="text-[#2196F3] hover:text-[#1976D2] transition-colors"
                    on:click={() => showSignUp = false}
                >
                    Already have an account? Log in
                </button>
            </div>
        {:else}
            <LoginForm />
            <div class="mt-4 text-center">
                <button 
                    class="text-[#2196F3] hover:text-[#1976D2] transition-colors"
                    on:click={() => showSignUp = true}
                >
                    Don't have an account? Sign up
                </button>
            </div>
        {/if}
    </div>
</div> 