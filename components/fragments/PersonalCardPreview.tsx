import { Colors } from "@/constants/Colors";
import { formatDate } from "@/controllers/utils";
import { globalStyles } from "@/styles/global";
import { styles } from "@/styles/home";
import AntDesign from "@expo/vector-icons/AntDesign";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";

interface PersonalCardCarouselProps {
  cards: any[];
  openCard: (id: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const GAP = 30;

export default function PersonalCardCarousel({
  cards,
  openCard,
}: PersonalCardCarouselProps) {
  const themeColors = Colors["dark"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderCard = ({ item }: { item: any }) => {
    const formattedNumber = item?.number.match(/.{1,4}/g)?.join(" ") ?? "";

    return (
      <View
        style={[
          globalStyles.flexr,
          globalStyles.wfull,
          styles.personalCardPreview,
          {
            backgroundColor: themeColors.grey,
            width: CARD_WIDTH,
          },
        ]}
      >
        <View
          style={[
            styles.cardFirst,
            globalStyles.flexc,
            { justifyContent: "space-around", alignItems: "flex-start" },
          ]}
        >
          <Text style={styles.cardPreviewText}>{item.name}</Text>
          <Text style={styles.cardPreviewText}>{formattedNumber}</Text>
          <View
            style={[
              globalStyles.flexc,
              {
                justifyContent: "space-around",
                alignItems: "flex-start",
                gap: 10,
              },
            ]}
          >
            <Text>VALIDADE</Text>
            <Text style={styles.cardPreviewText}>
              {formatDate(item.validAt)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.cardSecond,
            globalStyles.flexc,
            { backgroundColor: themeColors.greyLight },
          ]}
        >
          <Pressable
            onPress={() => {
              openCard(item);
            }}
            style={[
              styles.previewBtnBox,
              globalStyles.flexc,
              globalStyles.wfull,
              { gap: 10 },
            ]}
          >
            <View
              style={[
                styles.previewBtn,
                globalStyles.flexc,
                { backgroundColor: themeColors.tint },
              ]}
            >
              <AntDesign name="eye" size={24} color={themeColors.background} />
            </View>
            <Text style={{ color: themeColors.background, fontWeight: "600" }}>
              Ver dados{"\n"} do cartão
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const onScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + GAP));
    setCurrentIndex(index);
  };

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
          gap: 30,
        }}
      />

      {/* Dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 10,
          gap: 8,
        }}
      >
        {cards.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === currentIndex ? 12 : 8,
              height: i === currentIndex ? 12 : 8,
              borderRadius: 6,
              marginTop: 20,
              backgroundColor:
                i === currentIndex ? themeColors.tint : themeColors.greyMedium,
            }}
          />
        ))}
      </View>
    </View>
  );
}
