import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";
import { formatDate, toTitleCase } from "@/controllers/utils";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface PersonalCardCarouselProps {
  cards: any[];
  openCard: (id: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const GAP = 16;

function getInitials(name?: string): string {
  if (!name) return "";
  const ignored = new Set(["de", "da", "do", "das", "dos", "e"]);
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p && !ignored.has(p.toLowerCase()));
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatCardNumber(num?: string): string {
  if (!num) return "";
  return String(num).replace(/(.{4})/g, "$1 ").trim();
}

export default function PersonalCardCarousel({
  cards,
  openCard,
}: PersonalCardCarouselProps) {
  const themeColors = Colors["dark"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderCard = ({ item }: { item: any }) => {
    const isPJ = item?.type === "PJ" || !!item?.companyName;
    const planLabel = isPJ ? item.companyName : item.typeName;

    return (
      <View
        style={[
          styles.card,
          {
            width: CARD_WIDTH,
            backgroundColor: themeColors.backgroundSecondary,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <View
            style={[styles.avatar, { backgroundColor: themeColors.tint }]}
          >
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <View style={styles.cardTopInfo}>
            <Text
              style={[styles.cardName, { color: themeColors.background }]}
              numberOfLines={1}
            >
              {toTitleCase(item.name)}
            </Text>
            {planLabel ? (
              <Text
                style={[styles.cardPlan, { color: themeColors.background }]}
                numberOfLines={1}
              >
                Benefício: <Text style={{ fontWeight: "700" }}>{planLabel}</Text>
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.cardRowItem}>
            <Text style={styles.cardLabel}>Carteirinha Nº</Text>
            <Text
              style={[styles.cardValue, { color: themeColors.background }]}
            >
              {formatCardNumber(item.number)}
            </Text>
          </View>
          <View style={styles.cardRowItem}>
            <Text style={styles.cardLabel}>Data de nascimento</Text>
            <Text
              style={[styles.cardValue, { color: themeColors.background }]}
            >
              {formatDate(item.birthDate)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Pressable
          onPress={() => openCard(item)}
          style={[styles.cta, { backgroundColor: themeColors.tint }]}
        >
          <Text style={[styles.ctaText, { color: themeColors.background }]}>
            Carteirinha Digital
          </Text>
        </Pressable>
      </View>
    );
  };

  const onScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + GAP));
    setCurrentIndex(Math.max(0, Math.min(index, cards.length - 1)));
  };

  if (cards.length === 1) {
    return (
      <View style={{ alignItems: "center" }}>
        {renderCard({ item: cards[0] })}
      </View>
    );
  }

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="start"
        snapToInterval={CARD_WIDTH + GAP}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          gap: GAP,
          paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
          alignItems: "center",
        }}
      />

      {cards.length > 1 ? (
        <View style={styles.dots}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === currentIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i === currentIndex
                    ? themeColors.tint
                    : themeColors.greyMedium,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  cardTopInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  cardPlan: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
    opacity: 0.85,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  cardRowItem: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
    opacity: 0.55,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: "#00000015",
    marginVertical: 14,
  },
  cta: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
    gap: 6,
    alignItems: "center",
  },
});
