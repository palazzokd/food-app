import React, { useCallback, useState } from 'react';
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

import { Card } from '../../components/ui';
import PressableScale from '../../components/ui/PressableScale';
import { fetchMealPlanByWeek } from '../../services/modules';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import {
  addDays,
  dayIndexToday,
  mondayOf,
  toISODate,
  weekLabel,
} from '../../utils/dates';
import type { MealPlan, MealPlanEntry, MealTypeValue } from '../../types/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_ORDER: MealTypeValue[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export default function MealPlannerScreen({ navigation }: any) {
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (week: Date) => {
    setLoading(true);
    setPlan(await fetchMealPlanByWeek(toISODate(week)));
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load(weekStart);
    }, [weekStart])
  );

  const shiftWeek = (weeks: number) => {
    setWeekStart((prev) => addDays(prev, weeks * 7));
  };

  const todayIdx = dayIndexToday(weekStart);

  const entriesByDay = new Map<number, MealPlanEntry[]>();
  for (const entry of plan?.entries ?? []) {
    const list = entriesByDay.get(entry.day_of_week) ?? [];
    list.push(entry);
    entriesByDay.set(entry.day_of_week, list);
  }
  const sortEntries = (entries: MealPlanEntry[]) =>
    [...entries].sort(
      (a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)
    );
  const todayEntries = todayIdx !== null ? sortEntries(entriesByDay.get(todayIdx) ?? []) : [];
  const isPastWeek = weekStart.getTime() < mondayOf(new Date()).getTime();

  const openEntry = (entry: MealPlanEntry) => {
    if (entry.recipe_id) {
      navigation.navigate('Recipes', {
        screen: 'RecipeDetail',
        params: { recipeId: entry.recipe_id },
        initial: false,
      });
    }
  };

  const planWithAI = () => {
    const weekIso = toISODate(weekStart);
    navigation.navigate('Chat', {
      initialPrompt: plan
        ? `Let's adjust the meal plan for the week starting ${weekIso}. Show me what's planned and ask me what I'd like to change.`
        : `Plan our dinners for the week starting ${weekIso} around our family favorites, then log the expected nutrition targets for each day of that week.`,
      promptKey: Date.now(),
    });
  };

  const renderEntry = (entry: MealPlanEntry) => (
    <TouchableOpacity
      key={entry.id}
      style={styles.mealCell}
      onPress={() => openEntry(entry)}
      disabled={!entry.recipe_id}
    >
      <Text style={styles.mealLabel}>
        {MEAL_ICONS[entry.meal_type]} {entry.meal_type.toUpperCase()}
      </Text>
      <Text style={styles.mealTitle}>
        {entry.title}
        {entry.recipe_id ? '  ›' : ''}
      </Text>
      {entry.notes ? <Text style={styles.mealNotes}>{entry.notes}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(weekStart)} />}
    >
      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => shiftWeek(-1)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.forest} />
        </TouchableOpacity>
        <View style={styles.weekLabelWrap}>
          <Text style={styles.weekLabelText}>{weekLabel(weekStart)}</Text>
          {weekLabel(weekStart) !== 'This Week' ? (
            <TouchableOpacity onPress={() => setWeekStart(mondayOf(new Date()))}>
              <Text style={styles.backToToday}>Back to this week</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => shiftWeek(1)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.forest} />
        </TouchableOpacity>
      </View>

      {/* Today hero (only when viewing the current week) */}
      {todayIdx !== null ? (
        <Card style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>
              Today · {DAYS[todayIdx]}{' '}
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          {todayEntries.length > 0 ? (
            todayEntries.map(renderEntry)
          ) : (
            <Text style={styles.todayEmpty}>
              Nothing planned for today{plan ? '' : ' — no plan for this week yet'}.
            </Text>
          )}
        </Card>
      ) : null}

      {/* Full week — all 7 days, planned or not */}
      {DAYS.map((dayName, dayIdx) => {
        const entries = sortEntries(entriesByDay.get(dayIdx) ?? []);
        return (
          <Card
            key={dayIdx}
            style={
              dayIdx === todayIdx
                ? { ...styles.dayCard, ...styles.dayCardToday }
                : styles.dayCard
            }
          >
            <View style={styles.dayTitleRow}>
              <Text style={styles.dayTitle}>{dayName}</Text>
              {dayIdx === todayIdx ? (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              ) : null}
            </View>
            {entries.length > 0 ? (
              entries.map(renderEntry)
            ) : (
              <Text style={styles.dayEmpty}>Nothing planned</Text>
            )}
          </Card>
        );
      })}

      {!isPastWeek ? (
        <PressableScale style={styles.aiButton} onPress={planWithAI}>
          <Ionicons name="sparkles" size={16} color={colors.white} style={styles.aiButtonIcon} />
          <Text style={styles.aiButtonText}>
            {plan ? 'Adjust this week with AI' : `Plan ${weekLabel(weekStart).toLowerCase()} with AI`}
          </Text>
        </PressableScale>
      ) : null}
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  weekLabelWrap: {
    alignItems: 'center',
  },
  weekLabelText: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.forest,
  },
  backToToday: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.sage,
    marginTop: 2,
  },
  todayCard: {
    borderWidth: 1.5,
    borderColor: colors.warm,
    backgroundColor: '#FFFDF7',
  },
  todayHeader: {
    marginBottom: 8,
  },
  todayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.amber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dayCard: {},
  dayCardToday: {
    borderColor: colors.warm,
    borderWidth: 1.5,
  },
  dayEmpty: {
    fontSize: 13,
    color: colors.placeholder,
    fontStyle: 'italic',
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warm,
    textTransform: 'uppercase',
  },
  todayBadge: {
    backgroundColor: colors.warm,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },
  mealCell: {
    backgroundColor: colors.mist,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  mealLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.sage,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  mealTitle: {
    fontSize: 14,
    color: colors.charcoal,
    fontWeight: '500',
  },
  mealNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  aiButton: {
    backgroundColor: colors.forest,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  aiButtonIcon: {
    marginRight: 8,
  },
  aiButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
