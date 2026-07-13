import React, { useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card, CardTitle } from '../../components/ui';
import { useDataStore } from '../../store/dataStore';
import { colors } from '../../theme/colors';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TARGETS = [
  {
    key: 'legumes' as const,
    emoji: '🫘',
    name: 'Legumes',
    desc: '½ cup most days',
    examples: 'Black beans, chickpeas, lentils, edamame',
    color: colors.forest,
  },
  {
    key: 'leafy_greens' as const,
    emoji: '🥬',
    name: 'Leafy Greens',
    desc: '1 serving daily',
    examples: 'Spinach, arugula, kale, romaine',
    color: colors.sage,
  },
  {
    key: 'nuts_seeds' as const,
    emoji: '🌰',
    name: 'Nuts & Seeds',
    desc: 'Small handful most days',
    examples: 'Walnuts, pepitas, pine nuts, hemp, chia, flax',
    color: colors.warm,
  },
];

export default function NutritionScreen() {
  const { nutritionWeek, loadNutrition, toggleNutritionTarget, loading } = useDataStore();

  useFocusEffect(
    useCallback(() => {
      loadNutrition();
    }, [])
  );

  // Build a full Mon–Sun view of the week, merging in logged days
  const weekDays: { date: string; dayIdx: number; logged?: (typeof nutritionWeek extends null ? never : NonNullable<typeof nutritionWeek>['days'][number]) }[] = [];
  if (nutritionWeek) {
    const start = new Date(nutritionWeek.week_start + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      weekDays.push({
        date: iso,
        dayIdx: i,
        logged: nutritionWeek.days.find((x) => x.date === iso),
      });
    }
  }

  const score = nutritionWeek?.targets_hit ?? 0;
  const possible = nutritionWeek?.targets_possible ?? 21;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNutrition} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>The Plate At A Glance Framework</Text>
        <Text style={styles.heroSub}>
          Three foods. Eaten most days. Built into meals, not supplements. Consistency beats
          perfection.
        </Text>
      </View>

      {TARGETS.map((t) => (
        <Card key={t.key} style={{ borderTopWidth: 4, borderTopColor: t.color }}>
          <Text style={styles.targetEmoji}>{t.emoji}</Text>
          <Text style={[styles.targetName, { color: t.color }]}>{t.name}</Text>
          <Text style={styles.targetDesc}>{t.desc}</Text>
          <Text style={styles.targetExamples}>{t.examples}</Text>
        </Card>
      ))}

      <Card>
        <CardTitle>This Week — Tap to Toggle</CardTitle>
        <View style={styles.gridHeader}>
          <View style={styles.dayCol} />
          {TARGETS.map((t) => (
            <Text key={t.key} style={styles.colLabel}>
              {t.emoji}
            </Text>
          ))}
        </View>
        {weekDays.map(({ date, dayIdx, logged }) => (
          <View key={date} style={styles.gridRow}>
            <Text style={styles.dayLabel}>{DAYS_SHORT[dayIdx]}</Text>
            {TARGETS.map((t) => {
              const hit = logged ? logged[t.key] : false;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={styles.cell}
                  onPress={() => toggleNutritionTarget(date, t.key, !hit)}
                >
                  <Text style={styles.cellMark}>{hit ? '✅' : '⬜'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>
            Weekly score: {score}/{possible} targets hit
            {possible > 0 ? ` — ${Math.round((score / possible) * 100)}%` : ''}
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: colors.forest,
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 19,
  },
  targetEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  targetName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  targetDesc: {
    fontSize: 13,
    color: colors.charcoal,
    marginBottom: 4,
  },
  targetExamples: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gridHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCol: {
    width: 44,
  },
  colLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLabel: {
    width: 44,
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  cellMark: {
    fontSize: 18,
  },
  scoreBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.moss,
  },
});
