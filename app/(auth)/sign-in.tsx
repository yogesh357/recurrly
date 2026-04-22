import { useSignIn } from '@clerk/expo';
import { Link, useRouter, type Href } from 'expo-router';
import { styled } from 'nativewind';
import { usePostHog } from 'posthog-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);

type MfaStrategy = 'phone_code' | 'totp' | 'backup_code' | 'email_code';

const SUPPORTED_MFA_STRATEGIES: MfaStrategy[] = ['phone_code', 'totp', 'backup_code', 'email_code'];

const SignIn = () => {
    const { signIn, errors, fetchStatus } = useSignIn();
    const router = useRouter();
    const posthog = usePostHog();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [mfaStrategy, setMfaStrategy] = useState<MfaStrategy | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    // Validation states
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);

    // Client-side validation
    const emailValid = emailAddress.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
    const passwordValid = password.length > 0;
    const formValid = emailAddress.length > 0 && password.length > 0 && emailValid;
    const getSupportedMfaStrategies = () =>
        (signIn.supportedSecondFactors ?? [])
            .map((factor) => factor.strategy)
            .filter((strategy): strategy is MfaStrategy => SUPPORTED_MFA_STRATEGIES.includes(strategy as MfaStrategy));

    const supportedMfaStrategies = getSupportedMfaStrategies();

    const getMfaStrategyLabel = (strategy: MfaStrategy) => {
        switch (strategy) {
            case 'phone_code':
                return 'Phone Code';
            case 'totp':
                return 'Authenticator App';
            case 'backup_code':
                return 'Backup Code';
            case 'email_code':
                return 'Email Code';
            default:
                return 'Verification Code';
        }
    };

    const trackSuccessfulSignIn = (userId?: string | null) => {
        if (!userId) {
            console.warn('Unable to identify PostHog user after sign-in.');
            return;
        }

        posthog.identify(userId, {
            $set_once: { first_sign_in_date: new Date().toISOString() },
        });
        posthog.capture('user_signed_in', { userId });
    };

    const navigateToApp = (url: string) => {
        if (url.startsWith('http')) {
            if (typeof window !== 'undefined' && window.location) {
                window.location.href = url;
            } else {
                router.replace('/(tabs)' as Href);
            }
        } else {
            router.replace(url as Href);
        }
    };

    const finalizeSignIn = async () => {
        await signIn.finalize({
            navigate: ({ session, decorateUrl }) => {
                if (session?.currentTask) {
                    console.log(session.currentTask);
                    return;
                }

                trackSuccessfulSignIn(session?.user?.id);
                navigateToApp(decorateUrl('/(tabs)'));
            },
        });
    };

    const prepareSecondFactor = async (strategy: MfaStrategy) => {
        setMfaStrategy(strategy);
        setCode('');
        setAuthError(null);

        if (strategy === 'phone_code') {
            const { error } = await signIn.mfa.sendPhoneCode();
            if (error) {
                setAuthError(error.message);
            }
        }

        if (strategy === 'email_code') {
            const { error } = await signIn.mfa.sendEmailCode();
            if (error) {
                setAuthError(error.message);
            }
        }
    };

    const handleResendCode = async () => {
        setAuthError(null);

        if (signIn.status === 'needs_client_trust' || mfaStrategy === 'email_code') {
            const { error } = await signIn.mfa.sendEmailCode();
            if (error) {
                setAuthError(error.message);
            }
            return;
        }

        if (mfaStrategy === 'phone_code') {
            const { error } = await signIn.mfa.sendPhoneCode();
            if (error) {
                setAuthError(error.message);
            }
        }
    };

    const handleSubmit = async () => {
        if (!formValid) return;

        setAuthError(null);
        const { error } = await signIn.password({
            emailAddress,
            password,
        });

        if (error) {
            console.error(JSON.stringify(error, null, 2));
            posthog.capture('user_sign_in_failed', {
                error_message: error.message,
            });
            setAuthError(error.message);
            return;
        }

        if (signIn.status === 'complete') {
            await finalizeSignIn();
        } else if (signIn.status === 'needs_second_factor') {
            const defaultStrategy = getSupportedMfaStrategies()[0];

            if (!defaultStrategy) {
                setAuthError('A second factor is required, but no supported verification method is available.');
                return;
            }

            await prepareSecondFactor(defaultStrategy);
        } else if (signIn.status === 'needs_client_trust') {
            setCode('');
            const { error: resendError } = await signIn.mfa.sendEmailCode();
            if (resendError) {
                setAuthError(resendError.message);
            }
        } else {
            console.error('Sign-in attempt not complete:', signIn);
        }
    };

    const handleClientTrustVerify = async () => {
        setAuthError(null);
        const { error } = await signIn.mfa.verifyEmailCode({ code });

        if (error) {
            setAuthError(error.message);
            return;
        }

        if (signIn.status === 'complete') {
            await finalizeSignIn();
        } else {
            console.error('Sign-in attempt not complete:', signIn);
        }
    };

    const handleSecondFactorVerify = async () => {
        if (!mfaStrategy) {
            setAuthError('Choose a verification method to continue.');
            return;
        }

        setAuthError(null);

        let error = null;
        switch (mfaStrategy) {
            case 'phone_code':
                ({ error } = await signIn.mfa.verifyPhoneCode({ code }));
                break;
            case 'totp':
                ({ error } = await signIn.mfa.verifyTOTP({ code }));
                break;
            case 'backup_code':
                ({ error } = await signIn.mfa.verifyBackupCode({ code }));
                break;
            case 'email_code':
                ({ error } = await signIn.mfa.verifyEmailCode({ code }));
                break;
            default:
                setAuthError('Unsupported verification method.');
                return;
        }

        if (error) {
            setAuthError(error.message);
            return;
        }

        if (signIn.status === 'complete') {
            await finalizeSignIn();
        } else {
            console.error('Sign-in attempt not complete:', signIn);
        }
    };

    // Show verification screen if client trust or MFA is needed
    if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
        const isClientTrustVerification = signIn.status === 'needs_client_trust';
        const verifyButtonDisabled =
            !code || fetchStatus === 'fetching' || (!isClientTrustVerification && !mfaStrategy);

        return (
            <SafeAreaView className="auth-safe-area">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="auth-screen"
                >
                    <ScrollView
                        className="auth-scroll"
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="auth-content">
                            {/* Branding */}
                            <View className="auth-brand-block">
                                <View className="auth-logo-wrap">
                                    <View className="auth-logo-mark">
                                        <Text className="auth-logo-mark-text">R</Text>
                                    </View>
                                    <View>
                                        <Text className="auth-wordmark">Recurrly</Text>
                                        <Text className="auth-wordmark-sub">SUBSCRIPTIONS</Text>
                                    </View>
                                </View>
                                <Text className="auth-title">
                                    {isClientTrustVerification ? 'Verify your identity' : 'Verify your sign in'}
                                </Text>
                                <Text className="auth-subtitle">
                                    {isClientTrustVerification
                                        ? 'We sent a verification code to your email'
                                        : `Enter your ${getMfaStrategyLabel(mfaStrategy ?? supportedMfaStrategies[0] ?? 'totp').toLowerCase()} to continue`}
                                </Text>
                            </View>

                            {/* Verification Form */}
                            <View className="auth-card">
                                <View className="auth-form">
                                    {!isClientTrustVerification && supportedMfaStrategies.length > 1 && (
                                        <View className="auth-field">
                                            <Text className="auth-label">Verification Method</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {supportedMfaStrategies.map((strategy) => (
                                                    <Pressable
                                                        key={strategy}
                                                        className={`rounded-2xl border px-4 py-3 ${mfaStrategy === strategy ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                                                        onPress={() => void prepareSecondFactor(strategy)}
                                                        disabled={fetchStatus === 'fetching'}
                                                    >
                                                        <Text
                                                            className={`font-sans-medium ${mfaStrategy === strategy ? 'text-primary' : 'text-foreground'}`}
                                                        >
                                                            {getMfaStrategyLabel(strategy)}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    <View className="auth-field">
                                        <Text className="auth-label">Verification Code</Text>
                                        <TextInput
                                            className="auth-input"
                                            value={code}
                                            placeholder={mfaStrategy === 'backup_code' ? 'Enter backup code' : 'Enter verification code'}
                                            placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                            onChangeText={setCode}
                                            keyboardType={mfaStrategy === 'backup_code' ? 'default' : 'number-pad'}
                                            autoComplete={mfaStrategy === 'backup_code' ? undefined : 'one-time-code'}
                                            autoCapitalize="none"
                                        />
                                        {errors.fields.code && (
                                            <Text className="auth-error">{errors.fields.code.message}</Text>
                                        )}
                                        {authError && <Text className="auth-error">{authError}</Text>}
                                    </View>

                                    <Pressable
                                        className={`auth-button ${verifyButtonDisabled && 'auth-button-disabled'}`}
                                        onPress={isClientTrustVerification ? handleClientTrustVerify : handleSecondFactorVerify}
                                        disabled={verifyButtonDisabled}
                                    >
                                        <Text className="auth-button-text">
                                            {fetchStatus === 'fetching'
                                                ? 'Verifying...'
                                                : isClientTrustVerification
                                                    ? 'Verify'
                                                    : 'Verify Sign In'}
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        className="auth-secondary-button"
                                        onPress={() => void handleResendCode()}
                                        disabled={
                                            fetchStatus === 'fetching' ||
                                            (!isClientTrustVerification &&
                                                mfaStrategy !== 'phone_code' &&
                                                mfaStrategy !== 'email_code')
                                        }
                                    >
                                        <Text className="auth-secondary-button-text">Resend Code</Text>
                                    </Pressable>

                                    <Pressable
                                        className="auth-secondary-button"
                                        onPress={() => void signIn.reset()}
                                        disabled={fetchStatus === 'fetching'}
                                    >
                                        <Text className="auth-secondary-button-text">Start Over</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // Main sign-in form
    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="auth-screen"
            >
                <ScrollView
                    className="auth-scroll"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="auth-content">
                        {/* Branding */}
                        <View className="auth-brand-block">
                            <View className="auth-logo-wrap">
                                <View className="auth-logo-mark">
                                    <Text className="auth-logo-mark-text">R</Text>
                                </View>
                                <View>
                                    <Text className="auth-wordmark">Recurrly</Text>
                                    <Text className="auth-wordmark-sub">SUBSCRIPTIONS</Text>
                                </View>
                            </View>
                            <Text className="auth-title">Welcome back</Text>
                            <Text className="auth-subtitle">
                                Sign in to continue managing your subscriptions
                            </Text>
                        </View>

                        {/* Sign-In Form */}
                        <View className="auth-card">
                            <View className="auth-form">
                                <View className="auth-field">
                                    <Text className="auth-label">Email Address</Text>
                                    <TextInput
                                        className={`auth-input ${emailTouched && !emailValid && 'auth-input-error'}`}
                                        autoCapitalize="none"
                                        value={emailAddress}
                                        placeholder="name@example.com"
                                        placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                        onChangeText={setEmailAddress}
                                        onBlur={() => setEmailTouched(true)}
                                        keyboardType="email-address"
                                        autoComplete="email"
                                    />
                                    {emailTouched && !emailValid && (
                                        <Text className="auth-error">Please enter a valid email address</Text>
                                    )}
                                    {errors.fields.identifier && (
                                        <Text className="auth-error">{errors.fields.identifier.message}</Text>
                                    )}
                                </View>

                                <View className="auth-field">
                                    <Text className="auth-label">Password</Text>
                                    <TextInput
                                        className={`auth-input ${passwordTouched && !passwordValid && 'auth-input-error'}`}
                                        value={password}
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                        secureTextEntry
                                        onChangeText={setPassword}
                                        onBlur={() => setPasswordTouched(true)}
                                        autoComplete="password"
                                    />
                                    {passwordTouched && !passwordValid && (
                                        <Text className="auth-error">Password is required</Text>
                                    )}
                                    {errors.fields.password && (
                                        <Text className="auth-error">{errors.fields.password.message}</Text>
                                    )}
                                </View>

                                <Pressable
                                    className={`auth-button ${(!formValid || fetchStatus === 'fetching') && 'auth-button-disabled'}`}
                                    onPress={handleSubmit}
                                    disabled={!formValid || fetchStatus === 'fetching'}
                                >
                                    <Text className="auth-button-text">
                                        {fetchStatus === 'fetching' ? 'Signing In...' : 'Sign In'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Sign-Up Link */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Don&apos;t have an account?</Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <Pressable>
                                    <Text className="auth-link">Create Account</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;
