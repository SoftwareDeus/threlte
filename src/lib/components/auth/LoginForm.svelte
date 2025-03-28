<script lang="ts">
    import { authStore } from '$lib/stores/authStore';
    import { goto } from '$app/navigation';

    let email = '';
    let password = '';
    let loading = false;
    let error: string | null = null;

    async function handleSubmit() {
        loading = true;
        error = null;

        const result = await authStore.signIn(email, password);
        
        if (result.success) {
            goto('/'); // Go to home page after successful login
        } else {
            error = $authStore.error;
        }

        loading = false;
    }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Welcome Back!</h2>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="space-y-6">
            <div>
                <label for="email" class="block text-sm font-medium text-white mb-2">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Enter your email"
                    required
                />
            </div>

            <div>
                <label for="password" class="block text-sm font-medium text-white mb-2">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Enter your password"
                    required
                />
            </div>

            {#if error}
                <div class="text-red-500 text-sm">
                    {error}
                </div>
            {/if}

            <button
                type="submit"
                class="w-full py-2 px-4 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
            >
                {loading ? 'Logging in...' : 'Log In'}
            </button>
        </div>
    </form>
</div> 