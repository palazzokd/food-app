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
import { Ionicons } from '@expo/vector-icons';

import { Card, CardTitle } from '../../components/ui';
import PressableScale from '../../components/ui/PressableScale';
import { useDataStore } from '../../store/dataStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TARGET_COLORS = [colors.forest, colors.sage, colors.warm, colors.moss, colors.amber, colors.blue];

export default function NutritionScreen({ navigation }: any) {
  const { nutritionWeek, loadNutrition, toggleNutritionTarget, loading } = useDataStore();

  useFocusEffect(
    useCallback(() => {
      loadNutrition();
    }, [])
  );

  const targets = nutritionWeek?.targets ?? [];
  const days = nutritionWeek?.days ?? [];
  const score = nutritionWeek?.targets_hit ?? 0;
  const possible = nutritionWeek?.targets_possible ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNutrition} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Your Daily Targets</Text>
        <Text style={styles.heroSub}>
          A few foods, eaten most days, built into meals — consistency beats perfection.
          These are yours to define.
        </Text>
      </View>

      {targets.map((t, i) => (
        <PressableScale
          key={t.id}
          style={{ ...styles.targetCard, borderTopColor: TARGET_COLORS[i % TARGET_COLORS.length] }}
          onPress={() => navigation.navigate('TargetEdit', { target: t })}
        >
          <View style={styles.targetHeader}>
            <Text style={styles.targetEmoji}>{t.emoji || '🎯'}</Text>
            <View style={styles.targetTitleWrap}>
              <Text style={[styles.targetName, { color: TARGET_COLORS[i % TARGET_COLORS.length] }]}>
                {t.name}
              </Text>
              {t.description ? <Text style={styles.targetDesc}>{t.description}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
          {t.examples ? <Text style={styles.targetExamples}>{t.examples}</Text> : null}
        </PressableScale>
      ))}

      <PressableScale style={styles.addBtn} onPress={() => navigation.navigate('TargetEdit')}>
        <Ionicons name="add" size={16} color={colors.forest} />
        <Text style={styles.addBtnText}>Add a target</Text>
      </PressableScale>

      {targets.length > 0 ? (
        <Card>
          <CardTitle>This Week — Tap to Toggle</CardTitle>
          <View style={styles.gridHeader}>
            <View style={styles.dayCol} />
            {targets.map((t) => (
              <Text key={t.id} style={styles.colLabel}>
                {t.emoji || '🎯'}
              </Text>
            ))}
          </View>
          {days.map((day, dayIdx) => (
            <View key={day.date} style={styles.gridRow}>
              <Text style={styles.dayLabel}>{DAYS_SHORT[dayIdx]}</Text>
              {targets.map((t) => {
                const hit = day.hits[t.id] ?? false;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.cell}
                    onPress={() => toggleNutritionTarget(t.id, day.date, !hit)}
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
      ) : (
        <Card>
          <Text style={styles.emptyText}>
            No targets yet — add one above, or ask the AI to suggest a framework for your
            family's goals.
          </Text>
        </Card>
      )}
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
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.white,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 19,
  },
  targetCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 4,
    padding: 14,
    marginBottom: 10,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  targetTitleWrap: {
    flex: 1,
  },
  targetName: {
    fontSize: 15,
    fontWeight: '700',
  },
  targetDesc: {
    fontSize: 12,
    color: colors.charcoal,
    marginTop: 1,
  },
  targetExamples: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: 10,
    paddingVertical: 11,
    marginBottom: 14,
  },
  addBtnText: {
    color: colors.forest,
    fontWeight: '600',
    fontSize: 14,
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
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
