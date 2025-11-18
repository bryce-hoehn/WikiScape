import useAsyncStorage from './useAsyncStorage';

const FONT_FAMILY_KEY = 'articleFontFamily';
const DEFAULT_FONT_FAMILY = 'system';

export type FontFamily =
  | 'system'
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'Roboto'
  | 'OpenSans'
  | 'Inter'
  | 'Lora'
  | 'Merriweather'
  | 'PlayfairDisplay';

const FONT_FAMILIES: { label: string; value: FontFamily }[] = [
  { label: 'System Default', value: 'system' },
  { label: 'Serif', value: 'serif' },
  { label: 'Sans Serif', value: 'sans-serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'OpenSans' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Playfair Display', value: 'PlayfairDisplay' },
];

const VALID_FONTS: FontFamily[] = [
  'system',
  'serif',
  'sans-serif',
  'monospace',
  'Roboto',
  'OpenSans',
  'Inter',
  'Lora',
  'Merriweather',
  'PlayfairDisplay',
];

export default function useFontFamily() {
  const {
    value: fontFamily,
    isLoading,
    updateValue,
  } = useAsyncStorage<FontFamily>(FONT_FAMILY_KEY, {
    defaultValue: DEFAULT_FONT_FAMILY,
    validator: (val) => VALID_FONTS.includes(val),
    serializer: (val) => val,
    deserializer: (val) => val as FontFamily,
  });

  return {
    fontFamily,
    isLoading,
    updateFontFamily: updateValue,
    fontFamilies: FONT_FAMILIES,
  };
}
