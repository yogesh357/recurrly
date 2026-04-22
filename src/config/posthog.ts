import Constants from 'expo-constants'
import PostHog from 'posthog-react-native'

const expoExtra = Constants.expoConfig?.extra as
    | { posthogProjectToken?: string; posthogHost?: string }
    | undefined

const rawApiKey = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN ?? expoExtra?.posthogProjectToken
const rawHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? expoExtra?.posthogHost

// Trim and normalize API key and host
const apiKey = rawApiKey?.trim()
const host = rawHost?.trim()
const isPostHogConfigured = !!apiKey && apiKey !== '' && apiKey !== 'phc_your_project_token_here'

if (!isPostHogConfigured) {
    console.warn(
        'PostHog project token not configured. Analytics will be disabled. ' +
        'Set EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN and optionally EXPO_PUBLIC_POSTHOG_HOST in your .env file, or add posthogProjectToken/posthogHost to expo.extra.'
    )
}

export const posthog = new PostHog(apiKey || 'placeholder_key', {
    ...(host ? { host } : {}),
    disabled: !isPostHogConfigured,
    captureAppLifecycleEvents: true,
    // debug: __DEV__,
    flushAt: 20,
    flushInterval: 10000,
    maxBatchSize: 100,
    maxQueueSize: 1000,
    preloadFeatureFlags: true,
    sendFeatureFlagEvent: true,
    featureFlagsRequestTimeoutMs: 10000,
    requestTimeout: 10000,
    fetchRetryCount: 3,
    fetchRetryDelay: 3000,
})
