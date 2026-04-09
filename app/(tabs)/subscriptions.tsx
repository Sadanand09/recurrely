import "@/global.css";
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/context/SubscriptionsContext";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const [search, setSearch] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const { subscriptions } = useSubscriptions();

  const filtered = subscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase()) ||
    sub.category?.toLowerCase().includes(search.toLowerCase()) ||
    sub.plan?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePress = (item: Subscription) => {
    setExpandedSubscriptionId((prev) => (prev === item.id ? null : item.id));
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
      <Text className="text-2xl font-sans-bold text-foreground mb-4">Subscriptions</Text>

      <View className="flex-row items-center bg-muted rounded-2xl px-4 mb-5 h-14 gap-3">
        <Ionicons name="search-outline" size={20} color="rgba(0,0,0,0.4)" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search subscriptions..."
          placeholderTextColor="rgba(0,0,0,0.4)"
          className="flex-1 text-foreground text-base font-sans-medium"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => handlePress(item)}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state text-center mt-10">
            No subscriptions found.
          </Text>
        }
        contentContainerClassName="pb-30"
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Subscriptions;
