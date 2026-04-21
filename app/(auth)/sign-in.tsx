import { useSignIn } from "@clerk/expo";
import clsx from "clsx";
import { Link, type Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getApiErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== "object") return "Something went wrong. Please try again.";

    const possible = error as {
        errors?: Array<{ longMessage?: string; message?: string }>;
        message?: string;
    };

    return (
        possible.errors?.[0]?.longMessage ||
        possible.errors?.[0]?.message ||
        possible.message ||
        "Something went wrong. Please try again."
    );
};

const completeNavigation = (
    routerPush: (href: Href) => void,
    decorateUrl: (to: string) => string,
): void => {
    const url = decorateUrl("/");
    if (url.startsWith("http") && typeof window !== "undefined") {
        window.location.href = url;
        return;
    }
    routerPush(url as Href);
};

function SignIn() {
    const { signIn, errors, fetchStatus } = useSignIn();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [codeError, setCodeError] = useState<string | null>(null);

    const isSubmitting = fetchStatus === "fetching";
    const trimmedEmail = useMemo(() => emailAddress.trim().toLowerCase(), [emailAddress]);

    const emailValidationError = useMemo(() => {
        if (!emailAddress.trim()) return "Email is required.";
        if (!emailRegex.test(trimmedEmail)) return "Please enter a valid email address.";
        return null;
    }, [emailAddress, trimmedEmail]);

    const passwordValidationError = useMemo(() => {
        if (!password.trim()) return "Password is required.";
        return null;
    }, [password]);

    const isClientTrustStep = signIn.status === "needs_client_trust";

    const handleSubmit = async () => {
        setFormError(null);

        if (emailValidationError || passwordValidationError) {
            setFormError(emailValidationError || passwordValidationError);
            return;
        }

        const { error } = await signIn.password({
            emailAddress: trimmedEmail,
            password,
        });

        if (error) {
            setFormError(getApiErrorMessage(error));
            return;
        }

        if (signIn.status === "complete") {
            await signIn.finalize({
                navigate: ({ session, decorateUrl }) => {
                    if (session?.currentTask) {
                        setFormError("A quick account step is still pending. Please complete it first.");
                        return;
                    }
                    completeNavigation((href) => router.replace(href), decorateUrl);
                },
            });
            return;
        }

        if (signIn.status === "needs_client_trust") {
            const emailCodeFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === "email_code",
            );

            if (emailCodeFactor) {
                const sendCode = await signIn.mfa.sendEmailCode();
                if (sendCode.error) {
                    setFormError(getApiErrorMessage(sendCode.error));
                }
                return;
            }
        }

        if (signIn.status === "needs_second_factor") {
            setFormError("Additional verification is required for this account.");
            return;
        }

        setFormError("We could not finish your sign in. Please try again.");
    };

    const handleVerify = async () => {
        setCodeError(null);
        setFormError(null);

        if (!/^\d{6}$/.test(code.trim())) {
            setCodeError("Enter the 6-digit code sent to your email.");
            return;
        }

        const verifyResult = await signIn.mfa.verifyEmailCode({ code: code.trim() });

        if (verifyResult.error) {
            setCodeError(getApiErrorMessage(verifyResult.error));
            return;
        }

        if (signIn.status === "complete") {
            await signIn.finalize({
                navigate: ({ session, decorateUrl }) => {
                    if (session?.currentTask) {
                        setFormError("A quick account step is still pending. Please complete it first.");
                        return;
                    }
                    completeNavigation((href) => router.replace(href), decorateUrl);
                },
            });
            return;
        }

        setCodeError("Verification is not complete yet. Request a new code and try again.");
    };

    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                className="auth-screen"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView className="auth-scroll" contentContainerClassName="auth-content">
                    <View className="auth-brand-block">
                        <View className="auth-logo-wrap">
                            <View className="auth-logo-mark">
                                <Text className="auth-logo-mark-text">R</Text>
                            </View>
                            <View>
                                <Text className="auth-wordmark">Recurrly</Text>
                                <Text className="auth-wordmark-sub">Subscription command center</Text>
                            </View>
                        </View>

                        <Text className="auth-title">{isClientTrustStep ? "Confirm it’s you" : "Welcome back"}</Text>
                        <Text className="auth-subtitle">
                            {isClientTrustStep
                                ? "We sent a verification code to your email to protect your account."
                                : "Sign in to stay on top of every renewal and keep spending predictable."}
                        </Text>
                    </View>

                    <View className="auth-card">
                        {!isClientTrustStep ? (
                            <View className="auth-form">
                                <View className="auth-field">
                                    <Text className="auth-label">Email</Text>
                                    <TextInput
                                        className={clsx("auth-input", (emailValidationError || errors.fields.identifier) && "auth-input-error")}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        textContentType="emailAddress"
                                        placeholder="you@company.com"
                                        placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                        value={emailAddress}
                                        onChangeText={setEmailAddress}
                                    />
                                    {emailValidationError ? <Text className="auth-error">{emailValidationError}</Text> : null}
                                    {errors.fields.identifier?.message ? (
                                        <Text className="auth-error">{errors.fields.identifier.message}</Text>
                                    ) : null}
                                </View>

                                <View className="auth-field">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="auth-label">Password</Text>
                                        <Pressable onPress={() => setShowPassword((value) => !value)}>
                                            <Text className="auth-link">{showPassword ? "Hide" : "Show"}</Text>
                                        </Pressable>
                                    </View>
                                    <TextInput
                                        className={clsx("auth-input", (passwordValidationError || errors.fields.password) && "auth-input-error")}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        secureTextEntry={!showPassword}
                                        textContentType="password"
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    {passwordValidationError ? (
                                        <Text className="auth-error">{passwordValidationError}</Text>
                                    ) : null}
                                    {errors.fields.password?.message ? (
                                        <Text className="auth-error">{errors.fields.password.message}</Text>
                                    ) : null}
                                </View>

                                {formError ? <Text className="auth-error">{formError}</Text> : null}

                                <Pressable
                                    className={clsx(
                                        "auth-button",
                                        (Boolean(emailValidationError) || Boolean(passwordValidationError) || isSubmitting) &&
                                        "auth-button-disabled",
                                    )}
                                    onPress={handleSubmit}
                                    disabled={Boolean(emailValidationError) || Boolean(passwordValidationError) || isSubmitting}
                                >
                                    <Text className="auth-button-text">{isSubmitting ? "Signing in..." : "Continue"}</Text>
                                </Pressable>

                                <View className="auth-divider-row">
                                    <View className="auth-divider-line" />
                                    <Text className="auth-divider-text">Fast, secure access</Text>
                                    <View className="auth-divider-line" />
                                </View>

                                <View className="auth-link-row">
                                    <Text className="auth-link-copy">New here?</Text>
                                    <Link href="/(auth)/sign-up">
                                        <Text className="auth-link">Create account</Text>
                                    </Link>
                                </View>
                            </View>
                        ) : (
                            <View className="auth-form">
                                <View className="auth-field">
                                    <Text className="auth-label">Verification code</Text>
                                    <TextInput
                                        className={clsx(
                                            "auth-input",
                                            (codeError || errors.fields.code?.message) && "auth-input-error",
                                        )}
                                        keyboardType="number-pad"
                                        textContentType="oneTimeCode"
                                        maxLength={6}
                                        placeholder="Enter 6-digit code"
                                        placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                        value={code}
                                        onChangeText={setCode}
                                    />
                                    {codeError ? <Text className="auth-error">{codeError}</Text> : null}
                                    {errors.fields.code?.message ? (
                                        <Text className="auth-error">{errors.fields.code.message}</Text>
                                    ) : null}
                                    {formError ? <Text className="auth-error">{formError}</Text> : null}
                                </View>

                                <Pressable
                                    className={clsx("auth-button", (isSubmitting || code.trim().length !== 6) && "auth-button-disabled")}
                                    onPress={handleVerify}
                                    disabled={isSubmitting || code.trim().length !== 6}
                                >
                                    <Text className="auth-button-text">{isSubmitting ? "Verifying..." : "Verify and continue"}</Text>
                                </Pressable>

                                <Pressable
                                    className="auth-secondary-button"
                                    onPress={() => {
                                        setCodeError(null);
                                        signIn.mfa.sendEmailCode();
                                    }}
                                >
                                    <Text className="auth-secondary-button-text">Send a new code</Text>
                                </Pressable>

                                <Pressable
                                    className="auth-secondary-button"
                                    onPress={() => {
                                        signIn.reset();
                                        setCode("");
                                        setCodeError(null);
                                        setFormError(null);
                                    }}
                                >
                                    <Text className="auth-secondary-button-text">Start over</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

export default SignIn;
