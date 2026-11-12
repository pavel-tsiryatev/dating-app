/** Цвета и шрифты из макетов CAMPUS (бежевый фон, красные акценты, жирный курсив в заголовках). */
export const colors = {
  cream: '#F3DCBF',
  paper: '#F8E7D1',
  card: '#FBEEDC',
  red: '#E3061B',
  deepRed: '#B8001F',
  blush: '#F6CFC4',
  ink: '#241612',
  muted: '#6E5646',
  line: '#DDBF9F',
  green: '#3F8A3A',
  greenSoft: '#D9EBCB',
  amber: '#C77700',
  white: '#FFFFFF',
  overlay: 'rgba(36, 22, 18, 0.45)',
} as const;

export const fonts = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
  display: 'Montserrat_900Black_Italic',
  displaySoft: 'Montserrat_800ExtraBold_Italic',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const shadow = {
  shadowColor: '#5A2A14',
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

/** Растянуть картинку на весь контейнер (absoluteFill без явного размера на web не растягивает <Image>). */
export const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } as const;
