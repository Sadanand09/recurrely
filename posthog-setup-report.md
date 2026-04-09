<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Recurly subscription app. Here's what was added:

- **`posthog-react-native`** installed as a dependency (with required peer deps: `expo-file-system`, `expo-application`, `expo-device`, `expo-localization`, `react-native-svg`)
- **`app.config.js`** created (converting from `app.json`) to expose `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` via `expo-constants`
- **`src/config/posthog.ts`** created with a configured PostHog client (batching, lifecycle events, feature flags)
- **`app/_layout.tsx`** updated: `PostHogProvider` wrapping the app, manual screen tracking via `usePathname`
- **`app/(auth)/sign-in.tsx`** updated: user identification on successful sign-in/MFA, capture of sign-in success and failure events
- **`app/(auth)/sign-up.tsx`** updated: user identification on successful sign-up, capture of sign-up success and failure events
- **`app/(tabs)/settings.tsx`** updated: capture `user_signed_out` and call `posthog.reset()` before Clerk sign-out
- **`app/(tabs)/index.tsx`** updated: capture `subscription_expanded` (with subscription name/category/billing) and `add_subscription_tapped`

| Event | Description | File |
|-------|-------------|------|
| `user_signed_in` | User successfully completed sign-in | `app/(auth)/sign-in.tsx` |
| `user_sign_in_failed` | User attempted sign-in but encountered an error | `app/(auth)/sign-in.tsx` |
| `user_mfa_verified` | User successfully verified MFA/email code during sign-in | `app/(auth)/sign-in.tsx` |
| `user_signed_up` | User successfully completed account creation and email verification | `app/(auth)/sign-up.tsx` |
| `user_sign_up_failed` | User attempted sign-up but encountered an error | `app/(auth)/sign-up.tsx` |
| `user_signed_out` | User signed out from the settings screen | `app/(tabs)/settings.tsx` |
| `subscription_expanded` | User expanded a subscription card to view details | `app/(tabs)/index.tsx` |
| `add_subscription_tapped` | User tapped the add subscription button | `app/(tabs)/index.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/374960/dashboard/1447099)
- **Insight**: [Daily Sign-ins & Sign-ups](https://us.posthog.com/project/374960/insights/AB8Y6pIh)
- **Insight**: [Sign-up to Sign-in Conversion Funnel](https://us.posthog.com/project/374960/insights/iBgXU66S)
- **Insight**: [Sign-out Rate (Churn Signal)](https://us.posthog.com/project/374960/insights/WxrHDN2k)
- **Insight**: [Subscription Engagement](https://us.posthog.com/project/374960/insights/oJQd9gNd)
- **Insight**: [Auth Failure Rate](https://us.posthog.com/project/374960/insights/COSvvUeq)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
