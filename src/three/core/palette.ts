/**
 * Scene colours, mirrored from the CSS design tokens in styles/tokens.css.
 * Kept as strings so every scene creates its own THREE.Color instances.
 */
export const palette = {
  cream: '#fffaf7',
  blush: '#ffdbe6',
  pink: '#f9a8c2',
  bubblegum: '#f47fa4',
  rose: '#e0517f',
  berry: '#b83565',
  peach: '#ffc7a6',
  butter: '#ffe39a',
  mint: '#a9e5c8',
  ink: '#2e2229',
} as const;

export type PaletteColor = keyof typeof palette;

/** The candy colours toys are painted with. */
export const toyColors = [
  palette.pink,
  palette.bubblegum,
  palette.blush,
  palette.peach,
  palette.butter,
  palette.cream,
  palette.rose,
] as const;
