import "@/global.css";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import dayjs from "dayjs";
import { icons } from "@/constants/icons";
import { posthog } from "@/src/config/posthog";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];
type Frequency = "Monthly" | "Yearly";

const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: "#fcd6a4",
  "AI Tools":    "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design:        "#f5c542",
  Productivity:  "#b8e8d0",
  Cloud:         "#c8d8f0",
  Music:         "#f8d0e0",
  Other:         "#d4d4d4",
};

const CATEGORY_EMOJIS: Record<Category, string> = {
  Entertainment:    "🎬",
  "AI Tools":       "🤖",
  "Developer Tools":"💻",
  Design:           "🎨",
  Productivity:     "⚡",
  Cloud:            "☁️",
  Music:            "🎵",
  Other:            "📦",
};

// ── Design tokens (mirrors global.css @theme) ────────────────────────────────
const T = {
  accent:      "#ea7a53",
  primary:     "#081126",
  background:  "#fff9e3",
  card:        "#fff8e7",
  muted:       "#f6eecf",
  mutedFg:     "rgba(0,0,0,0.55)",
  border:      "rgba(0,0,0,0.1)",
  borderHard:  "rgba(0,0,0,0.08)",
} as const;

// ── Props ────────────────────────────────────────────────────────────────────

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const CreateSubscriptionModal = ({
  visible,
  onClose,
  onSubmit,
}: CreateSubscriptionModalProps) => {
  const [name, setName]           = useState("");
  const [price, setPrice]         = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory]   = useState<Category | null>(null);

  const parsedPrice = parseFloat(price);
  const isValid =
    name.trim().length > 0 && !isNaN(parsedPrice) && parsedPrice > 0;

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = () => {
    if (!isValid) return;
    const now = dayjs();
    const newSub: Subscription = {
      id:          `custom-${Date.now()}`,
      icon:        icons.wallet,
      name:        name.trim(),
      price:       parsedPrice,
      currency:    "USD",
      billing:     frequency,
      category:    category ?? undefined,
      status:      "active",
      startDate:   now.toISOString(),
      renewalDate: (frequency === "Monthly"
        ? now.add(1, "month")
        : now.add(1, "year")).toISOString(),
      color: category ? CATEGORY_COLORS[category] : "#d4d4d4",
    } as unknown as Subscription;
    onSubmit(newSub);

    posthog.capture("subscription_created", {
      subscription_name: name.trim(),
      subscription_price: parsedPrice,
      subscription_billing: frequency,
      subscription_category: category ?? null,
    });
    resetForm();
  };

  // ── preview values ───────────────────────────────────────────────────────
  const previewName  = name.trim() || "Your Subscription";
  const previewPrice = parsedPrice > 0
    ? `$${parsedPrice.toFixed(2)}`
    : "$—";
  const chipBg = category ? CATEGORY_COLORS[category] : "rgba(255,255,255,0.25)";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* ── Scrim ─────────────────────────────────────────────────────────── */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
        onPress={handleClose}
      />

      {/* ── Sheet ─────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      >
        <View
          style={{
            backgroundColor: T.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: 680,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.14,
            shadowRadius: 20,
            elevation: 24,
          }}
        >
          {/* Drag handle */}
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{
                width: 38, height: 4, borderRadius: 2,
                backgroundColor: "rgba(0,0,0,0.15)",
              }}
            />
          </View>

          {/* ── Live preview card ──────────────────────────────────────────── */}
          <View
            style={{
              margin: 16,
              marginBottom: 0,
              borderRadius: 20,
              backgroundColor: T.accent,
              padding: 18,
              shadowColor: T.accent,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            {/* top row: label + close */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "sans-semibold", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Preview
              </Text>
              <Pressable
                onPress={handleClose}
                style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontFamily: "sans-bold" }}>✕</Text>
              </Pressable>
            </View>

            {/* subscription preview row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {/* icon swatch */}
              <View
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  backgroundColor: chipBg,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Image
                  source={icons.wallet}
                  style={{ width: 26, height: 26, tintColor: T.primary }}
                />
              </View>

              {/* name + category */}
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#fff",
                    fontSize: 17,
                    fontFamily: "sans-bold",
                    marginBottom: 3,
                  }}
                >
                  {previewName}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-medium" }}>
                  {category ? `${CATEGORY_EMOJIS[category]} ${category}` : "No category"} · {frequency}
                </Text>
              </View>

              {/* price */}
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#fff", fontSize: 22, fontFamily: "sans-extrabold" }}>
                  {previewPrice}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "sans-medium" }}>
                  /{frequency === "Monthly" ? "mo" : "yr"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Form ──────────────────────────────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingTop: 18, gap: 20 }}
          >
            {/* Section: Basics */}
            <SectionLabel text="Basics" />

            {/* Name */}
            <View style={{ gap: 6 }}>
              <FieldLabel text="Service Name" />
              <TextInput
                style={inputStyle}
                placeholder="e.g. Netflix, Spotify…"
                placeholderTextColor={T.mutedFg}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>

            {/* Price */}
            <View style={{ gap: 6 }}>
              <FieldLabel text="Price" />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: T.background,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    backgroundColor: T.muted,
                    borderRightWidth: 1,
                    borderRightColor: T.borderHard,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, fontFamily: "sans-bold", color: T.primary }}>$</Text>
                </View>
                <TextInput
                  style={{
                    flex: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 16,
                    fontFamily: "sans-medium",
                    color: T.primary,
                  }}
                  placeholder="0.00"
                  placeholderTextColor={T.mutedFg}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginRight: 8,
                    borderRadius: 10,
                    backgroundColor: T.muted,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: "sans-semibold", color: T.mutedFg }}>USD</Text>
                </View>
              </View>
            </View>

            {/* Section: Billing */}
            <SectionLabel text="Billing" />

            {/* Frequency toggle */}
            <View style={{ gap: 6 }}>
              <FieldLabel text="Billing Frequency" />
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: T.muted,
                  borderRadius: 16,
                  padding: 4,
                  gap: 4,
                }}
              >
                {(["Monthly", "Yearly"] as Frequency[]).map((opt) => {
                  const active = frequency === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setFrequency(opt)}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: active ? T.background : "transparent",
                        shadowColor: active ? "#000" : "transparent",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: active ? 0.07 : 0,
                        shadowRadius: active ? 4 : 0,
                        elevation: active ? 2 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: active ? "sans-bold" : "sans-medium",
                          color: active ? T.accent : T.mutedFg,
                          marginBottom: 2,
                        }}
                      >
                        {opt}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: "sans-medium",
                          color: active ? T.accent : "transparent",
                        }}
                      >
                        {opt === "Monthly" ? "Billed monthly" : "Save ~17%"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section: Category */}
            <SectionLabel text="Category" />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory((prev) => (prev === cat ? null : cat))}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: active ? T.accent : T.border,
                      backgroundColor: active ? "rgba(234,122,83,0.08)" : T.card,
                    }}
                  >
                    {/* colored dot */}
                    <View
                      style={{
                        width: 8, height: 8, borderRadius: 4,
                        backgroundColor: CATEGORY_COLORS[cat],
                        borderWidth: active ? 0 : 1,
                        borderColor: "rgba(0,0,0,0.1)",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: active ? "sans-bold" : "sans-semibold",
                        color: active ? T.accent : T.mutedFg,
                      }}
                    >
                      {CATEGORY_EMOJIS[cat]} {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!isValid}
              style={{
                marginTop: 4,
                borderRadius: 18,
                paddingVertical: 17,
                alignItems: "center",
                backgroundColor: isValid ? T.accent : "rgba(234,122,83,0.4)",
                shadowColor: isValid ? T.accent : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isValid ? 0.4 : 0,
                shadowRadius: 10,
                elevation: isValid ? 6 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "sans-bold",
                  color: isValid ? T.primary : "rgba(8,17,38,0.5)",
                  letterSpacing: 0.2,
                }}
              >
                {isValid ? "Add Subscription →" : "Fill in name & price"}
              </Text>
            </Pressable>

            {/* bottom breathing room */}
            <View style={{ height: Platform.OS === "ios" ? 16 : 8 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Small helpers ─────────────────────────────────────────────────────────────

const inputStyle = {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.1)" as const,
  backgroundColor: "#fff9e3",
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 16,
  fontFamily: "sans-medium",
  color: "#081126",
};

const SectionLabel = ({ text }: { text: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
    <Text
      style={{
        fontSize: 11,
        fontFamily: "sans-bold",
        color: "rgba(0,0,0,0.35)",
        letterSpacing: 1.4,
        textTransform: "uppercase",
      }}
    >
      {text}
    </Text>
    <View style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.07)" }} />
  </View>
);

const FieldLabel = ({ text }: { text: string }) => (
  <Text
    style={{
      fontSize: 13,
      fontFamily: "sans-semibold",
      color: "#081126",
    }}
  >
    {text}
  </Text>
);

export default CreateSubscriptionModal;
