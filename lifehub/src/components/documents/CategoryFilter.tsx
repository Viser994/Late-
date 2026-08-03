import React from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DocumentCategory } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { CATEGORY_META, spacing, radius, typography } from '../../constants/theme';

const ALL_CATEGORIES: (DocumentCategory | 'all')[] = [
  'all',
  'identity',
  'insurance',
  'warranty',
  'medical',
  'finance',
  'travel',
  'receipt',
  'other',
];

interface CategoryFilterProps {
  selected: DocumentCategory | 'all';
  onSelect: (cat: DocumentCategory | 'all') => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {ALL_CATEGORIES.map((cat) => {
        const isActive = cat === selected;
        const meta = cat === 'all' ? null : CATEGORY_META[cat];
        const color = meta?.color ?? theme.primary;

        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            activeOpacity={0.75}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? color : theme.surfaceMuted,
                borderColor: isActive ? color : theme.cardBorder,
              },
            ]}
          >
            {meta && (
              <MaterialCommunityIcons
                name={meta.icon as any}
                size={13}
                color={isActive ? '#fff' : color}
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[
                styles.chipLabel,
                { color: isActive ? '#fff' : theme.textSecondary },
              ]}
            >
              {cat === 'all' ? 'All' : meta?.label ?? cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    gap: spacing[2],
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: typography.xs,
    fontWeight: typography.weight.semibold,
  },
});
