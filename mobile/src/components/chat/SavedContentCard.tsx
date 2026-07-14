import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import type { SavedContentInfo } from '../../types/chat';

const CARD_CONFIG: Record<
  SavedContentInfo['contentType'],
  { icon: keyof typeof Ionicons.glyphMap; label: string; action: string }
> = {
  recipe_saved: { icon: 'book', label: 'Recipe saved', action: 'View recipe' },
  meal_plan_saved: { icon: 'calendar', label: 'Meal plan saved', action: 'View plan' },
  grocery_list_saved: { icon: 'cart', label: 'Grocery list updated', action: 'View list' },
  nutrition_logged: { icon: 'leaf', label: 'Nutrition logged', action: 'View tracker' },
};

export default function SavedContentCard({
  info,
  onPress,
}: {
  info: SavedContentInfo;
  onPress: () => void;
}) {
  const config = CARD_CONFIG[info.contentType];
  if (!config) return null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Ionicons name={config.icon} size={20} color={colors.sage} style={styles.icon} />
      <View style={styles.textWrap}>
        <Text style={styles.label}>{config.label}</Text>
        {info.title ? <Text style={styles.title}>{info.title}</Text> : null}
      </View>
      <Text style={styles.action}>{config.action}</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.forest} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.sage,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  icon: {
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginTop: 2,
  },
  action: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forest,
    marginLeft: 8,
  },
});
