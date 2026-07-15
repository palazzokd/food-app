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

import { Card, EmptyState } from '../../components/ui';
import PressableScale from '../../components/ui/PressableScale';
import { useDataStore } from '../../store/dataStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { MealPlanEntry, MealTypeValue } from '../../types/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_ORDER: MealTypeValue[] = ['breakfast', 'lunch', 'dinner'];
const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export default function MealPlannerScreen({ navigation }: any) {
  const { mealPlan, loadMealPlan, loading } = useDataStore();

  useFocusEffect(
    useCallback(() => {
      loadMealPlan();
    }, [])
  );

  const entriesByDay = new Map<number, MealPlanEntry[]>();
  for (const entry of mealPlan?.entries ?? []) {
    const list = entriesByDay.get(entry.day_of_week) ?? [];
    list.push(entry);
    entriesByDay.set(entry.day_of_week, list);
  }
  const activeDays = [...entriesByDay.keys()].sort();

  const openEntry = (entry: MealPlanEntry) => {
    if (entry.recipe_id) {
      navigation.navigate('Recipes', {
        screen: 'RecipeDetail',
        params: { recipeId: entry.recipe_id },
        initial: false,
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMealPlan} />}
    >
      {mealPlan ? (
        <>
          <Text style={styles.heading}>{mealPlan.title || 'This Week'}</Text>
          <Text style={styles.subheading}>Week of {mealPlan.week_start_date}</Text>

          {activeDays.map((dayIdx) => {
            const entries = (entriesByDay.get(dayIdx) ?? []).sort(
              (a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)
            );
            return (
              <Card key={dayIdx}>
                <Text style={styles.dayTitle}>{DAYS[dayIdx]}</Text>
                {entries.map((entry) => (
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
                ))}
              </Card>
            );
          })}
        </>
      ) : (
        <EmptyState
          emoji="📅"
          message="No meal plan for this week yet. Ask the AI to plan your week — it saves the plan here."
        />
      )}

      <PressableScale
        style={styles.aiButton}
        onPress={() =>
          navigation.navigate('Chat', {
            initialPrompt: mealPlan
              ? "Let's adjust this week's meal plan. Show me what's planned and ask me what I'd like to change."
              : 'Plan my dinners for this week around our family favorites, then log the nutrition targets for each day.',
            promptKey: Date.now(),
          })
        }
      >
        <Ionicons name="sparkles" size={16} color={colors.white} style={styles.aiButtonIcon} />
        <Text style={styles.aiButtonText}>
          {mealPlan ? 'Adjust plan with AI' : 'Plan this week with AI'}
        </Text>
      </PressableScale>
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
  heading: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.forest,
  },
  subheading: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warm,
    textTransform: 'uppercase',
    marginBottom: 8,
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
