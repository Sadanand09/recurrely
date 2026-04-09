import { useSignIn } from "@clerk/expo";
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

const SafeAreaView = styled(RNSafeAreaView);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    code?: string;
    general?: string;
  }>({});

  const isLoading = fetchStatus === "fetching";

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Sign-in ──────────────────────────────────────────────────────────────────

  const handleSignIn = async () => {
    if (!validateForm()) return;
    setFieldErrors({});

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setFieldErrors({ general: error.message ?? "Something went wrong. Please try again." });
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/");
            if (!url.startsWith("http")) {
              router.replace("/(tabs)" as Href);
            }
          },
        });
      } else if (
        signIn.status === "needs_client_trust" ||
        signIn.status === "needs_second_factor"
      ) {
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (sendError) {
          // May already be sent — proceed to verify step anyway
        }
        setStep("mfa");
      } else {
        setFieldErrors({ general: "Sign-in could not be completed. Please try again." });
      }
    } catch (err: any) {
      setFieldErrors({
        general: err?.message ?? "Something went wrong. Please try again.",
      });
    }
  };

  // ── MFA Verify ───────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!code.trim()) {
      setFieldErrors({ code: "Verification code is required." });
      return;
    }
    setFieldErrors({});

    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });

      if (error) {
        setFieldErrors({ code: error.message ?? "Invalid code. Please try again." });
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/");
            if (!url.startsWith("http")) {
              router.replace("/(tabs)" as Href);
            }
          },
        });
      } else {
        setFieldErrors({ general: "Verification failed. Please try again." });
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

  // ── MFA / Email verification step ────────────────────────────────────────────

  if (step === "mfa") {
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

              <Text className="auth-title">Check your email</Text>
              <Text className="auth-subtitle">
                We sent a verification code to {email}. Enter it below to
                continue.
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

                  {/* Verify */}
                  <Pressable
                    className={`auth-button${isLoading ? " auth-button-disabled" : ""}`}
                    onPress={handleVerify}
                    disabled={isLoading}
                  >
                    <Text className="auth-button-text">
                      {isLoading ? "Verifying…" : "Verify"}
                    </Text>
                  </Pressable>

                  {/* Resend */}
                  <Pressable
                    className="auth-secondary-button"
                    onPress={() => signIn.mfa.sendEmailCode()}
                    disabled={isLoading}
                  >
                    <Text className="auth-secondary-button-text">
                      Resend code
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Start over */}
              <View className="auth-link-row">
                <Pressable
                  onPress={async () => {
                    await signIn.reset();
                    setStep("credentials");
                    setCode("");
                    setFieldErrors({});
                  }}
                >
                  <Text className="auth-link">Start over</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Default sign-in form ─────────────────────────────────────────────────────

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

            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">
              Sign in to continue managing your subscriptions
            </Text>

            <View className="auth-card">
              <View className="auth-form">
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
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    secureTextEntry
                    autoComplete="current-password"
                    textContentType="password"
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
                  onPress={handleSignIn}
                  disabled={isLoading || !email || !password}
                >
                  <Text className="auth-button-text">
                    {isLoading ? "Signing in…" : "Sign in"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Footer */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">New to Recurly?</Text>
              <Link href="/sign-up" asChild>
                <Pressable>
                  <Text className="auth-link">Create an account</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
