import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.cardTitle}>{children}</Text>;
}

export function Tag({ label, color = colors.sage }: { label: string; color?: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '22' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
      onPress={onPress}
    >
      <Text style={active ? styles.pillTextActive : styles.pillText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function StatCard({
  icon,
  value,
  label,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Ionicons name={icon} size={20} color={colors.sage} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Card>
  );
}

export function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forest,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tag: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 6,
  },
  pillActive: {
    backgroundColor: colors.forest,
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.forest,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forest,
  },
  pillTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 14,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.forest,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    color: colors.sage,
    marginTop: 3,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
