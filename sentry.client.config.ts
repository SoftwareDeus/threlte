import * as Sentry from '@sentry/sveltekit';

const environment = import.meta.env.PROD ? 'production' : 'development';

Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,
	environment,
	// Only send errors in production, or critical errors in development
	beforeSend(event) {
		if (environment === 'production') {
			return event;
		}
		// In development, only send critical errors
		if (event.level === 'fatal' || event.level === 'error') {
			return event;
		}
		return null;
	},
	// Adjust sampling rate based on environment
	tracesSampleRate: environment === 'production' ? 1.0 : 0.0,
	// Enable debug mode in development
	debug: environment === 'development'
});
