import { useSignUp } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { usePostHog } from "posthog-react-native";

const SafeAreaView = styled(RNSafeAreaView);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const posthog = usePostHog();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    code?: string;
    general?: string;
  }>({});

  const isLoading = fetchStatus === "fetching";

  // ── Validation ───────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Create account ───────────────────────────────────────────────────────────

  const handleSignUp = async () => {
    if (!validateForm()) return;
    setFieldErrors({});

    try {
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
        ...(name.trim() ? { firstName: name.trim().split(" ")[0], lastName: name.trim().split(" ").slice(1).join(" ") || undefined } : {}),
      });

      if (error) {
        setFieldErrors({ general: error.message ?? "Something went wrong. Please try again." });
        posthog.capture("user_sign_up_failed", { error_message: error.message });
        return;
      }

      // Trigger email verification
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setFieldErrors({ general: sendError.message ?? "Failed to send verification code. Please try again." });
        posthog.capture("user_sign_up_failed", { error_message: sendError.message });
        return;
      }

      setStep("verify");
    } catch (err: any) {
      setFieldErrors({
        general: err?.message ?? "Something went wrong. Please try again.",
      });
      posthog.capture("user_sign_up_failed", { error_message: err?.message });
    }
  };

  // ── Verify email ─────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!code.trim()) {
      setFieldErrors({ code: "Verification code is required." });
      return;
    }
    setFieldErrors({});

    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });

      if (error) {
        setFieldErrors({ code: error.message ?? "Invalid code. Please try again." });
        return;
      }

      if (signUp.status === "complete") {
        posthog.identify(email.trim(), {
          $set: { email: email.trim(), ...(name.trim() ? { name: name.trim() } : {}) },
          $set_once: { sign_up_date: new Date().toISOString() },
        });
        posthog.capture("user_signed_up", { has_name: !!name.trim() });
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/");
            if (!url.startsWith("http")) {
              router.replace("/(tabs)" as Href);
            }
          },
        });
      } else {
        setFieldErrors({ general: "Verification could not be completed. Please try again." });
      }
    } catch (err: any) {
      setFieldErrors({
        code: err?.message ?? "Invalid code. Please try again.",
      });
    }
  };

  // ── Brand block (shared) ─────────────────────────────────────────────────────

  const BrandBlock = () => (
    <View className="auth-brand-block">
      <View className="auth-logo-wrap">
        <View className="auth-logo-mark">
          <Text className="auth-logo-mark-text">R</Text>
        </View>
        <View>
          <Text className="auth-wordmark">Recurly</Text>
          <Text className="auth-wordmark-sub">Smart Billing</Text>
        </View>
      </View>
    </View>
  );

  // ── Email verification step ───────────────────────────────────────────────────

  if (step === "verify") {
    return (
      <SafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="auth-screen"
        >
          <ScrollView
            className="auth-scroll"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="auth-content">
              <BrandBlock />

              <Text className="auth-title">Verify your email</Text>
              <Text className="auth-subtitle">
                We sent a 6-digit code to {email}. Enter it below to activate
                your account.
              </Text>

              <View className="auth-card">
                <View className="auth-form">
                  {/* Code */}
                  <View className="auth-field">
                    <Text className="auth-label">Verification code</Text>
                    <TextInput
                      className={`auth-input${fieldErrors.code ? " auth-input-error" : ""}`}
                      value={code}
                      onChangeText={(v) => {
                        setCode(v);
                        if (fieldErrors.code)
                          setFieldErrors((p) => ({ ...p, code: undefined }));
                      }}
                      placeholder="Enter the 6-digit code"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      keyboardType="number-pad"
                      autoFocus
                    />
                    {fieldErrors.code && (
                      <Text className="auth-error">{fieldErrors.code}</Text>
                    )}
                  </View>

                  {fieldErrors.general && (
                    <Text className="auth-error">{fieldErrors.general}</Text>
                  )}

                  {/* Verify CTA */}
                  <Pressable
                    className={`auth-button${isLoading ? " auth-button-disabled" : ""}`}
                    onPress={handleVerify}
                    disabled={isLoading}
                  >
                    <Text className="auth-button-text">
                      {isLoading ? "Verifying…" : "Verify email"}
                    </Text>
                  </Pressable>

                  {/* Resend */}
                  <Pressable
                    className="auth-secondary-button"
                    onPress={() => signUp.verifications.sendEmailCode()}
                    disabled={isLoading}
                  >
                    <Text className="auth-secondary-button-text">
                      Resend code
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Default sign-up form ──────────────────────────────────────────────────────

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="auth-screen"
      >
        <ScrollView
          className="auth-scroll"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="auth-content">
            <BrandBlock />

            <Text className="auth-title">Create your account</Text>
            <Text className="auth-subtitle">
              Start tracking your subscriptions in one place
            </Text>

            <View className="auth-card">
              <View className="auth-form">
                {/* Full name (optional) */}
                <View className="auth-field">
                  <Text className="auth-label">
                    Full name{" "}
                    <Text className="auth-helper">(optional)</Text>
                  </Text>
                  <TextInput
                    className="auth-input"
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    autoComplete="name"
                    textContentType="name"
                  />
                </View>

                {/* Email */}
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    className={`auth-input${fieldErrors.email ? " auth-input-error" : ""}`}
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (fieldErrors.email)
                        setFieldErrors((p) => ({ ...p, email: undefined }));
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                  {fieldErrors.email && (
                    <Text className="auth-error">{fieldErrors.email}</Text>
                  )}
                </View>

                {/* Password */}
                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={`auth-input${fieldErrors.password ? " auth-input-error" : ""}`}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (fieldErrors.password)
                        setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="At least 8 characters"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                  {fieldErrors.password && (
                    <Text className="auth-error">{fieldErrors.password}</Text>
                  )}
                </View>

                {fieldErrors.general && (
                  <Text className="auth-error">{fieldErrors.general}</Text>
                )}

                {/* CTA */}
                <Pressable
                  className={`auth-button${isLoading || !email || !password ? " auth-button-disabled" : ""}`}
                  onPress={handleSignUp}
                  disabled={isLoading || !email || !password}
                >
                  <Text className="auth-button-text">
                    {isLoading ? "Creating account…" : "Create account"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Footer */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">Already have an account?</Text>
              <Link href="/sign-in" asChild>
                <Pressable>
                  <Text className="auth-link">Sign in</Text>
                </Pressable>
              </Link>
            </View>

            {/* Required for Clerk bot protection */}
            <View nativeID="clerk-captcha" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
