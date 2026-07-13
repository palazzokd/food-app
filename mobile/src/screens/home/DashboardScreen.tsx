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

import { Card, CardTitle, StatCard } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { colors } from '../../theme/colors';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DashboardScreen({ navigation }: any) {
  const { dashboard, loadDashboard, loading } = useDataStore();
  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const firstName = user?.display_name?.split(' ')[0];
  const dinners = dashboard?.meal_plan?.entries.filter((e) => e.meal_type === 'dinner') ?? [];

  const quickActions = [
    { label: '💬 Ask FamilyPlate AI', target: 'Chat' },
    { label: '🗓️ Meal Plan', target: 'Meals' },
    { label: '📖 Recipes', target: 'Recipes' },
    { label: '🛒 Grocery List', target: 'Grocery' },
    { label: '🥬 Nutrition', target: 'Nutrition' },
    { label: '👨‍👩‍👧‍👦 Family Profile', target: 'Family' },
  ];

  const navigate = (target: string) => {
    if (target === 'Nutrition' || target === 'Family') {
      navigation.navigate(target);
    } else {
      navigation.getParent()?.navigate(target);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} />}
    >
      <Text style={styles.greeting}>Good {greetingTime()}{firstName ? `, ${firstName}` : ''}! 👋</Text>
      {dashboard?.trial_days_left != null ? (
        <View style={styles.trialBadge}>
          <Text style={styles.trialText}>
            Free trial · {dashboard.trial_days_left} days left
          </Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <StatCard
          emoji="🍽️"
          value={String(dashboard?.recipe_count ?? 0)}
          label="Recipes"
          sub={`${dashboard?.favorite_count ?? 0} favorites ⭐`}
        />
        <StatCard
          emoji="📅"
          value={dashboard?.meal_plan ? `${dashboard.meal_plan.entries.length}` : '—'}
          label="Meals planned"
          sub={dashboard?.meal_plan?.title ?? 'No plan yet'}
        />
        <StatCard
          emoji="🥬"
          value={`${dashboard?.nutrition.targets_hit ?? 0}`}
          label="Targets hit"
          sub="this week"
        />
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <CardTitle>This Week's Dinners</CardTitle>
          <TouchableOpacity onPress={() => navigate('Meals')}>
            <Text style={styles.link}>View all →</Text>
          </TouchableOpacity>
        </View>
        {dinners.length > 0 ? (
          dinners.map((e) => (
            <View key={e.id} style={styles.dinnerRow}>
              <Text style={styles.dinnerDay}>{DAYS_SHORT[e.day_of_week]}</Text>
              <Text style={styles.dinnerTitle}>{e.title}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No plan yet — ask the AI to plan your week.
          </Text>
        )}
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <CardTitle>Nutrition — This Week</CardTitle>
          <TouchableOpacity onPress={() => navigate('Nutrition')}>
            <Text style={styles.link}>Details →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.nutritionHeader}>
          <View style={styles.nutritionDayCol} />
          {['🫘', '🥬', '🌰'].map((e) => (
            <Text key={e} style={styles.nutritionColLabel}>
              {e}
            </Text>
          ))}
        </View>
        {(dashboard?.nutrition.days ?? []).map((d) => {
          const dayIdx = (new Date(d.date + 'T00:00:00').getDay() + 6) % 7;
          return (
            <View key={d.id} style={styles.nutritionRow}>
              <Text style={styles.nutritionDay}>{DAYS_SHORT[dayIdx]}</Text>
              {[d.legumes, d.leafy_greens, d.nuts_seeds].map((hit, i) => (
                <Text key={i} style={styles.nutritionMark}>
                  {hit ? '✅' : '⬜'}
                </Text>
              ))}
            </View>
          );
        })}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>
            Weekly score: {dashboard?.nutrition.targets_hit ?? 0}/
            {dashboard?.nutrition.targets_possible ?? 21} · consistency beats perfection ✓
          </Text>
        </View>
      </Card>

      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <View style={styles.actionsWrap}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickAction}
              onPress={() => navigate(a.target)}
            >
              <Text style={styles.quickActionText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function greetingTime(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
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
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.forest,
    marginBottom: 6,
  },
  trialBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warm + '30',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  trialText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.sage,
    marginBottom: 12,
  },
  dinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dinnerDay: {
    width: 44,
    fontSize: 12,
    fontWeight: '700',
    color: colors.warm,
  },
  dinnerTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  nutritionHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  nutritionDayCol: {
    width: 44,
  },
  nutritionColLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutritionDay: {
    width: 44,
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  nutritionMark: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
  },
  scoreBox: {
    backgroundColor: colors.mist,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forest,
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAction: {
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forest,
  },
});
