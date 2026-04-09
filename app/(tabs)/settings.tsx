import "@/global.css";
import { useClerk, useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import { formatCurrency } from "@/lib/utils";
import images from "@/constants/images";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();
  const { subscriptions } = useSubscriptions();

  const handleSignOut = () => {
    posthog.capture("user_signed_out");
    posthog.reset();
    signOut();
  };

  const displayName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    "there";

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const activeSubscriptions = subscriptions.filter(
    (s) => !s.status || s.status === "active"
  );

  const monthlySpend = subscriptions.reduce((total, sub) => {
    const price = sub.price ?? 0;
    return total + (sub.billing === "Yearly" ? price / 12 : price);
  }, 0);

  const yearlySpend = subscriptions.reduce((total, sub) => {
    const price = sub.price ?? 0;
    return total + (sub.billing === "Monthly" ? price * 12 : price);
  }, 0);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        <Text
          style={{
            fontSize: 24,
            fontFamily: "sans-bold",
            color: "#081126",
            marginBottom: 20,
          }}
        >
          Settings
        </Text>

        {/* Profile Card */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            marginBottom: 12,
            paddingVertical: 8,
          }}
        >
          <View style={{ position: "relative" }}>
            <Image
              source={
                user?.imageUrl ? { uri: user.imageUrl } : images.avatar
              }
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                borderWidth: 2.5,
                borderColor: "#ea7a53",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#16a34a",
                borderWidth: 2,
                borderColor: "#fff9e3",
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 19,
                fontFamily: "sans-bold",
                color: "#081126",
              }}
            >
              {displayName}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "sans-regular",
                color: "rgba(0,0,0,0.45)",
                marginTop: 3,
              }}
              numberOfLines={1}
            >
              {email}
            </Text>
            {memberSince && (
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "sans-medium",
                  color: "rgba(0,0,0,0.3)",
                  marginTop: 4,
                }}
              >
                Member since {memberSince}
              </Text>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View
          style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}
        >
          {/* Active subscriptions — tall left card */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#ea7a53",
              borderRadius: 24,
              padding: 20,
              justifyContent: "flex-end",
              minHeight: 140,
            }}
          >
            <Text
              style={{
                fontSize: 42,
                fontFamily: "sans-extrabold",
                color: "#fff9e3",
                lineHeight: 44,
              }}
            >
              {activeSubscriptions.length}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "sans-semibold",
                color: "rgba(255,249,227,0.75)",
                marginTop: 6,
              }}
            >
              Active{"\n"}Subscriptions
            </Text>
          </View>

          {/* Right column: monthly + yearly */}
          <View style={{ flex: 1, gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#f6eecf",
                borderRadius: 24,
                padding: 16,
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "sans-semibold",
                  color: "rgba(0,0,0,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Monthly
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "sans-bold",
                  color: "#081126",
                  marginTop: 6,
                }}
              >
                {formatCurrency(monthlySpend)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#f6eecf",
                borderRadius: 24,
                padding: 16,
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "sans-semibold",
                  color: "rgba(0,0,0,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Yearly
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "sans-bold",
                  color: "#081126",
                  marginTop: 6,
                }}
              >
                {formatCurrency(yearlySpend)}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <SectionLabel label="Account" />
        <SettingsGroup>
          <SettingsRow icon="👤" label="Edit Profile" onPress={() => {}} />
          <RowDivider />
          <SettingsRow icon="🔔" label="Notifications" onPress={() => {}} />
          <RowDivider />
          <SettingsRow
            icon="🔒"
            label="Privacy & Security"
            onPress={() => {}}
          />
        </SettingsGroup>

        {/* Preferences Section */}
        <SectionLabel label="Preferences" />
        <SettingsGroup>
          <SettingsRow
            icon="💰"
            label="Default Currency"
            value="USD"
            onPress={() => {}}
          />
          <RowDivider />
          <SettingsRow
            icon="📅"
            label="Billing Reminders"
            value="3 days before"
            onPress={() => {}}
          />
          <RowDivider />
          <SettingsRow
            icon="🌙"
            label="Appearance"
            value="Light"
            onPress={() => {}}
          />
        </SettingsGroup>

        {/* About Section */}
        <SectionLabel label="About" />
        <SettingsGroup>
          <SettingsRow icon="ℹ️" label="App Version" value="1.0.0" />
          <RowDivider />
          <SettingsRow icon="📄" label="Privacy Policy" onPress={() => {}} />
          <RowDivider />
          <SettingsRow icon="💬" label="Help & Support" onPress={() => {}} />
        </SettingsGroup>

        {/* Sign Out */}
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? "rgba(220,38,38,0.08)" : "#fff8e7",
            borderRadius: 20,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: "rgba(220,38,38,0.15)",
          })}
          onPress={handleSignOut}
        >
          <Text style={{ fontSize: 18, width: 28 }}>🚪</Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: "sans-semibold",
              color: "#dc2626",
              flex: 1,
            }}
          >
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ─── Sub-components ────────────────────────────────────────────── */

const SectionLabel = ({ label }: { label: string }) => (
  <Text
    style={{
      fontSize: 11,
      fontFamily: "sans-semibold",
      color: "rgba(0,0,0,0.38)",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 4,
    }}
  >
    {label}
  </Text>
);

const SettingsGroup = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      backgroundColor: "#fff8e7",
      borderRadius: 20,
      marginBottom: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.07)",
    }}
  >
    {children}
  </View>
);

const SettingsRow = ({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) => (
  <Pressable
    style={({ pressed }) => ({
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      backgroundColor:
        pressed && onPress ? "rgba(0,0,0,0.04)" : "transparent",
    })}
    onPress={onPress}
    disabled={!onPress}
  >
    <Text style={{ fontSize: 18, width: 28, textAlign: "center" }}>{icon}</Text>
    <Text
      style={{
        flex: 1,
        fontSize: 15,
        fontFamily: "sans-medium",
        color: "#081126",
      }}
    >
      {label}
    </Text>
    {value && (
      <Text
        style={{
          fontSize: 13,
          fontFamily: "sans-regular",
          color: "rgba(0,0,0,0.4)",
        }}
      >
        {value}
      </Text>
    )}
    {onPress && (
      <Text
        style={{
          fontSize: 18,
          color: "rgba(0,0,0,0.25)",
          marginLeft: value ? 4 : 0,
          lineHeight: 20,
        }}
      >
        ›
      </Text>
    )}
  </Pressable>
);

const RowDivider = () => (
  <View
    style={{
      height: 1,
      backgroundColor: "rgba(0,0,0,0.07)",
      marginLeft: 56,
    }}
  />
);

export default Settings;
