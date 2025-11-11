import { StyleSheet, TextStyle } from "react-native";
import { Fonts } from "./Fonts";

// Estilos de texto padrão com Montserrat
export const textStyles = StyleSheet.create({
  // Títulos
  h1: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  } as TextStyle,
  h2: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 36,
  } as TextStyle,
  h3: {
    fontFamily: Fonts.semiBold,
    fontSize: 24,
    lineHeight: 32,
  } as TextStyle,
  h4: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,
  h5: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
  } as TextStyle,
  h6: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,

  // Corpo de texto
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodyMedium: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodySemiBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodyBold: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  // Texto pequeno
  small: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  smallMedium: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  smallSemiBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  smallBold: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  // Texto extra pequeno
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  captionMedium: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  captionSemiBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  captionBold: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,

  // Botões
  button: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  buttonSmall: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  // Links
  link: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    textDecorationLine: "underline",
  } as TextStyle,
  linkSmall: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: "underline",
  } as TextStyle,
});
