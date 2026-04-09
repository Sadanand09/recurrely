import "@/global.css";
import { useState } from "react";
import { ScrollView, Text, View, Image, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { icons } from "@/constants/icons";
import { formatCurrency } from "@/lib/utils";
import ListHeading from "@/components/ListHeading";

const SafeAreaView = styled(RNSafeAreaView);

// ─── Data ────────────────────────────────────────────────────────────────────

const WEEKLY_SPENDING = [
  { day: "Mon", amount: 35 },
  { day: "Tue", amount: 32 },
  { day: "Wed", amount: 23 },
  { day: "Thu", amount: 40 },
  { day: "Fri", amount: 33 },
  { day: "Sat", amount: 22 },
  { day: "Sun", amount: 24 },
];

const EXPENSES = {
  amount: 424.63,
  month: "March 2026",
  changePercent: 12,
  isIncrease: true,
};

const HISTORY_ITEMS = [
  {
    id: "claude-history",
    icon: icons.claude,
    name: "Claude",
    date: "June 25, 12:00",
    price: 9.84,
    billing: "per month",
    color: "#f5c542",
  },
  {
    id: "canva-history",
    icon: icons.canva,
    name: "Canva",
    date: "June 30, 16:00",
    price: 43.89,
    billing: "per month",
    color: "#8fd1bd",
  },
];

// ─── Bar chart ───────────────────────────────────────────────────────────────

// TOOLTIP_SPACE: room above the chart area so the tooltip is never clipped
const TOOLTIP_SPACE = 40;
const CHART_H = 148;
const BOTTOM_H = 24;
const Y_MAX = 45;
const Y_LABELS = [0, 5, 25, 35, 45];

function WeeklyBarChart({
  availableWidth,
  activeIdx,
  onBarPress,
}: {
  availableWidth: number;
  activeIdx: number;
  onBarPress: (idx: number) => void;
}) {
  const Y_AXIS_W = 28;
  const chartAreaW = availableWidth - Y_AXIS_W;
  const slotW = chartAreaW / WEEKLY_SPENDING.length;
  const barW = slotW * 0.44;
  const totalSvgH = TOOLTIP_SPACE + CHART_H + BOTTOM_H;

  const chartY = (value: number) =>
    TOOLTIP_SPACE + CHART_H - (value / Y_MAX) * CHART_H;

  return (
    <Svg width={availableWidth} height={totalSvgH}>
      {/* Grid lines + y-axis labels */}
      {Y_LABELS.map((label) => {
        const y = chartY(label);
        return (
          <G key={label}>
            <Line
              x1={Y_AXIS_W}
              y1={y}
              x2={availableWidth}
              y2={y}
              stroke="rgba(0,0,0,0.08)"
              strokeDasharray="4,4"
              strokeWidth={1}
            />
            <SvgText
              x={Y_AXIS_W - 4}
              y={y + 4}
              fontSize={10}
              fill="rgba(0,0,0,0.35)"
              textAnchor="end"
            >
              {label}
            </SvgText>
          </G>
        );
      })}

      {/* Bars */}
      {WEEKLY_SPENDING.map((item, idx) => {
        const barH = (item.amount / Y_MAX) * CHART_H;
        const x = Y_AXIS_W + idx * slotW + (slotW - barW) / 2;
        const barTop = chartY(item.amount);
        const centerX = x + barW / 2;
        const isActive = idx === activeIdx;

        // Tooltip dimensions
        const tooltipW = 52;
        const tooltipH = 24;
        const tooltipGap = 7;
        const tooltipX = centerX - tooltipW / 2;
        const tooltipY = barTop - tooltipGap - tooltipH;

        return (
          <G key={item.day} onPress={() => onBarPress(idx)}>
            {/* Invisible hit target for easier tapping */}
            <Rect
              x={x - 6}
              y={TOOLTIP_SPACE}
              width={barW + 12}
              height={CHART_H}
              fill="transparent"
            />

            {/* Bar */}
            <Rect
              x={x}
              y={barTop}
              width={barW}
              height={barH}
              fill={isActive ? "#ea7a53" : "#081126"}
              rx={7}
            />

            {/* Tooltip capsule */}
            {isActive && (
              <G>
                <Rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipW}
                  height={tooltipH}
                  fill="white"
                  rx={12}
                />
                <SvgText
                  x={centerX}
                  y={tooltipY + tooltipH / 2 + 4}
                  fontSize={12}
                  fontWeight="bold"
                  fill="#081126"
                  textAnchor="middle"
                >
                  ${item.amount}
                </SvgText>
              </G>
            )}

            {/* Day label */}
            <SvgText
              x={centerX}
              y={TOOLTIP_SPACE + CHART_H + 17}
              fontSize={11}
              fill={isActive ? "#ea7a53" : "rgba(0,0,0,0.45)"}
              fontWeight={isActive ? "bold" : "normal"}
              textAnchor="middle"
            >
              {item.day}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

const Insights = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  // 20px screen padding × 2, 16px card padding × 2
  const chartWidth = width - 40 - 32;

  // Thu (index 3) active by default
  const [activeBarIdx, setActiveBarIdx] = useState(3);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-30 pt-2"
      >
        {/* Header */}
        <View className="insights-header">
          <Pressable className="insights-nav-btn" onPress={() => router.navigate("/(tabs)")}>
            <Image source={icons.back} className="size-5" />
          </Pressable>

          <Text className="insights-title">Monthly Insights</Text>

          <Pressable className="insights-nav-btn">
            <Image source={icons.menu} className="size-5" />
          </Pressable>
        </View>

        {/* Upcoming + chart */}
        <ListHeading title="Upcoming" />

        <View className="insights-chart-card">
          <WeeklyBarChart
            availableWidth={chartWidth}
            activeIdx={activeBarIdx}
            onBarPress={setActiveBarIdx}
          />
        </View>

        {/* Expenses */}
        <View className="insights-expense-card">
          <View className="flex-row items-center justify-between">
            <Text className="insights-expense-label">Expenses</Text>
            <Text className="insights-expense-amount">
              -{formatCurrency(EXPENSES.amount)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="insights-expense-month">{EXPENSES.month}</Text>
            <Text className="insights-expense-change">
              {EXPENSES.isIncrease ? "+" : "-"}{EXPENSES.changePercent}%
            </Text>
          </View>
        </View>

        {/* History */}
        <ListHeading title="History" />

        <View className="gap-3">
          {HISTORY_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              className="insights-history-card active:opacity-80"
              style={{ backgroundColor: item.color }}
            >
              <Image source={item.icon} className="insights-history-icon" />

              <View className="ml-4 flex-1">
                <Text className="insights-history-name">{item.name}</Text>
                <Text className="insights-history-date">{item.date}</Text>
              </View>

              <View className="items-end">
                <Text className="insights-history-price">
                  {formatCurrency(item.price)}
                </Text>
                <Text className="insights-history-billing">{item.billing}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Insights;
