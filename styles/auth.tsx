import {
    StyleSheet
} from "react-native";
import { Fonts } from "@/constants/Fonts";

export const styles = StyleSheet.create({
    logo: {
        objectFit: 'contain',
        width: 300,
        height: 300
    },
    loginInputStyle : {
        width: "100%",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 22,
        fontFamily: Fonts.regular
    },
    loginBtnStyle: {
        width: "100%",
        padding: 15,
        borderRadius: 8,
        alignItems: "center"
    }
});
  