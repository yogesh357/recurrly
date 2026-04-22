declare namespace NodeJS {
    interface ProcessEnv {
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
        EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
        EXPO_PUBLIC_POSTHOG_HOST?: string;
    }
}
