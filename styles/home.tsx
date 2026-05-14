import { Fonts } from "@/constants/Fonts";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  helloTitle: {
    fontSize: 24,
    fontWeight: 600,
    fontFamily: Fonts.semiBold,
  },
  homeMain: {
    width: "100%",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 28,
    paddingBottom: 24,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  personalCardPreview: {
    height: 200,
    borderRadius: 35,
  },
  cardFirst: {
    width: "73%",
    height: "100%",
    paddingHorizontal: 25,
    paddingVertical: 25,
  },
  cardSecond: {
    width: "27%",
    height: "100%",
    borderTopRightRadius: 35,
    borderBottomRightRadius: 35,
  },
  cardPreviewText: {
    fontSize: 18,
    fontWeight: 600,
    fontFamily: Fonts.semiBold,
  },
  previewBtnBox: {
    width: "100%",
  },
  previewBtn: {
    width: 50,
    height: 50,
    borderRadius: 100,
  },
  menuCardMain: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  menuCardItem: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 8,
  },
  menuCardItemHighlight: {},
  menuCardItemText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Fonts.semiBold,
    textAlign: "center",
    lineHeight: 13,
  },
});
