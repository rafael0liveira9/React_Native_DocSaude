import { Fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

function digitsOf(value?: string): string {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
}

function formatPhone(raw?: string): string {
  const d = digitsOf(raw);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw ?? "";
}

function AccreditedItem({ item, themeColors }: any) {
  const [open, setOpen] = useState(false);
  const phoneDigits = digitsOf(item.telefone);
  const addressLine = [item.address, item.number, item.complement]
    .filter(Boolean)
    .join(", ");
  const locationLine = [item.city, item.uf].filter(Boolean).join(" - ");

  return (
    <View style={{ backgroundColor: themeColors.backgroundSecondary }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        android_ripple={{ color: "#0000000A" }}
        style={styles.row}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: themeColors.tint + "22" },
          ]}
        >
          <Ionicons name="medkit" size={22} color={themeColors.tint} />
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.name, { color: themeColors.background }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {addressLine ? (
            <Text
              style={[styles.address, { color: themeColors.background }]}
              numberOfLines={1}
            >
              {addressLine}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-forward"}
          size={20}
          color={themeColors.tint}
        />
      </Pressable>

      {open ? (
        <View style={styles.details}>
          {item.speciality ? (
            <DetailRow
              icon="medical-outline"
              text={item.speciality}
              themeColors={themeColors}
            />
          ) : null}
          {addressLine ? (
            <DetailRow
              icon="location-outline"
              text={addressLine}
              themeColors={themeColors}
            />
          ) : null}
          {locationLine ? (
            <DetailRow
              icon="business-outline"
              text={locationLine}
              themeColors={themeColors}
            />
          ) : null}
          {item.telefone ? (
            <DetailRow
              icon="call-outline"
              text={formatPhone(item.telefone)}
              themeColors={themeColors}
            />
          ) : null}
          {item.email ? (
            <DetailRow
              icon="mail-outline"
              text={item.email}
              themeColors={themeColors}
            />
          ) : null}
          {item.site ? (
            <DetailRow
              icon="globe-outline"
              text={item.site}
              themeColors={themeColors}
            />
          ) : null}
          {item.horario_semana ? (
            <DetailRow
              icon="time-outline"
              text={`Seg-Sex: ${item.horario_semana}`}
              themeColors={themeColors}
            />
          ) : null}
          {item.horario_sabado ? (
            <DetailRow
              icon="time-outline"
              text={`Sábado: ${item.horario_sabado}`}
              themeColors={themeColors}
            />
          ) : null}

          <View style={styles.actions}>
            {phoneDigits ? (
              <Pressable
                onPress={() => Linking.openURL(`tel:${phoneDigits}`)}
                style={[styles.cta, { backgroundColor: themeColors.tint }]}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.ctaText}>Ligar</Text>
              </Pressable>
            ) : null}
            {item.site ? (
              <Pressable
                onPress={() => {
                  const url = item.site.startsWith("http")
                    ? item.site
                    : `https://${item.site}`;
                  Linking.openURL(url);
                }}
                style={[
                  styles.cta,
                  styles.ctaSecondary,
                  { borderColor: themeColors.tint },
                ]}
              >
                <Ionicons name="globe" size={16} color={themeColors.tint} />
                <Text style={[styles.ctaText, { color: themeColors.tint }]}>
                  Site
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({
  icon,
  text,
  themeColors,
}: {
  icon: any;
  text: string;
  themeColors: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons
        name={icon}
        size={16}
        color={themeColors.background}
        style={{ opacity: 0.6 }}
      />
      <Text
        style={[styles.detailText, { color: themeColors.background }]}
        selectable
      >
        {text}
      </Text>
    </View>
  );
}

export default function AcredidetList({
  filteredEstablishments,
  themeColors,
}: any) {
  return (
    <FlatList
      scrollEnabled={false}
      data={filteredEstablishments}
      keyExtractor={(item) => item.id.toString()}
      ItemSeparatorComponent={() => (
        <View
          style={{ height: 1, backgroundColor: "#EFEFEF", marginLeft: 70 }}
        />
      )}
      renderItem={({ item }) => (
        <AccreditedItem item={item} themeColors={themeColors} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    opacity: 0.7,
  },
  details: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingLeft: 70,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  ctaSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.bold,
  },
});
