import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  helloTitle: {
    fontSize: 30,
    fontWeight: 600,
  },
  homeMain: {
    width: "100%",
    marginTop: 30,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 35,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
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
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuCardItem: {
    width: "31%",
    height: 115,
    marginBottom: 30,
    borderWidth: 2,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  menuCardItemText: {
    fontSize: 12,
    fontWeight: 600,
    textAlign: "left",
    flexWrap: "wrap",
  },
});
