export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const RADIUS = { md: 12, lg: 20, pill: 999 } as const;

// Inter for text, Plus Jakarta Sans for headings, buttons and figures. Each weight is its own
// embedded file, so styles pick a family and never set fontWeight: Android would fake the bold.
export const FONT = {
  text: "Inter-Regular",
  textStrong: "Inter-SemiBold",
  display: "PlusJakartaSans-SemiBold",
  displayBold: "PlusJakartaSans-Bold",
  displayHeavy: "PlusJakartaSans-ExtraBold",
} as const;

const BODY = { fontSize: 16, lineHeight: 22 } as const;
const CAPTION = { fontSize: 13, lineHeight: 18 } as const;

export const TYPE = {
  caption: { ...CAPTION, fontFamily: FONT.text },
  captionStrong: { ...CAPTION, fontFamily: FONT.textStrong },
  body: { ...BODY, fontFamily: FONT.text },
  bodyStrong: { ...BODY, fontFamily: FONT.textStrong },
  button: { ...BODY, fontFamily: FONT.display },
  // Section titles and money at body size.
  heading: { ...BODY, fontFamily: FONT.displayBold },
  figure: { ...BODY, fontFamily: FONT.displayBold },
  title: { fontSize: 20, lineHeight: 26, fontFamily: FONT.displayBold },
  hero: { fontSize: 28, lineHeight: 34, fontFamily: FONT.displayBold },
  amount: { fontSize: 40, lineHeight: 48, fontFamily: FONT.displayHeavy },
} as const;

export const TAP_MIN = 52;
