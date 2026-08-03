import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../constants/theme';
import { useSettingsStore } from '../store/settingsStore';

// Both themes share the same shape, only literal string values differ.
// We widen the return type so callers don't need to deal with literal narrowing.
export type ThemeColors = {
  [K in keyof typeof lightTheme]: string;
};

export function useTheme(): { theme: ThemeColors; isDark: boolean } {
  const systemScheme = useColorScheme();
  const { settings } = useSettingsStore();

  let isDark: boolean;
  if (settings.theme === 'system') {
    isDark = systemScheme === 'dark';
  } else {
    isDark = settings.theme === 'dark';
  }

  const raw = isDark ? darkTheme : lightTheme;
  return { theme: raw as unknown as ThemeColors, isDark };
}
