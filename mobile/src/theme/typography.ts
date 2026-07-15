import { StyleSheet } from 'react-native';

// Display font (headings, greetings, screen titles) — loaded in App.tsx
export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
};

export const typography = StyleSheet.create({
  display: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 32,
  },
  h1: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 30,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
