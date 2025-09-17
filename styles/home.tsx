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
    width: "100%",
    height: 280,
    borderRadius: 35,
  },
  cardFirst: {
    width: "80%",
    height: "100%",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  cardSecond: {
    width: "20%",
    height: "100%",
    borderTopRightRadius: 35,
    borderBottomRightRadius: 35,
  },
  cardPreviewText: {
    fontSize: 28,
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
    width: "30%",
    aspectRatio: 1,
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
    fontSize: 16,
    fontWeight: 600,
    textAlign: "left",
  },
});
