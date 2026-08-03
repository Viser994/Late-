import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../store/settingsStore';
import { Heading1, Heading3, Body } from '../components/shared/Typography';
import { Button } from '../components/shared/Button';
import { spacing, radius, typography } from '../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'view-dashboard-outline',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    title: 'Your life,\norganized',
    body: 'Bills, reminders, appointments, and documents — all in one secure place. Never miss a deadline again.',
  },
  {
    id: '2',
    icon: 'robot-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    title: 'AI does\nthe heavy lifting',
    body: 'Upload a document and AI extracts key dates, amounts, and action items automatically.',
  },
  {
    id: '3',
    icon: 'bell-ring-outline',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    title: 'Smart\nreminders',
    body: 'Get notified before bills are due, policies expire, or appointments arrive — always on time.',
  },
  {
    id: '4',
    icon: 'shield-check-outline',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    title: 'Safe &\nprivate',
    body: 'Your data stays on your device. Enable biometric lock for extra security.',
  },
];

export function OnboardingScreen() {
  const { theme, isDark } = useTheme();
  const { completeOnboarding } = useSettingsStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      const next = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Illustration circle */}
            <View
              style={[
                styles.illustrationWrap,
                { backgroundColor: isDark ? item.color + '22' : item.bgColor },
              ]}
            >
              <MaterialCommunityIcons name={item.icon as any} size={80} color={item.color} />
            </View>

            <Heading1
              style={[styles.title, { color: theme.textPrimary }]}
            >
              {item.title}
            </Heading1>

            <Body
              style={[styles.body, { color: theme.textSecondary }]}
            >
              {item.body}
            </Body>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              listRef.current?.scrollToIndex({ index: i, animated: true });
              setActiveIndex(i);
            }}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? theme.primary : theme.divider,
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          title={isLast ? "Let's Get Started" : 'Continue'}
          onPress={handleNext}
          fullWidth
          size="lg"
          style={{ borderRadius: radius.xl }}
        />
        {!isLast && (
          <TouchableOpacity onPress={() => completeOnboarding()} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: theme.textTertiary }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing[12],
  },
  slide: {
    width,
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },
  illustrationWrap: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 40,
  },
  body: {
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[8],
    marginBottom: spacing[6],
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
    gap: spacing[3],
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  skipText: {
    fontSize: typography.base,
  },
});
