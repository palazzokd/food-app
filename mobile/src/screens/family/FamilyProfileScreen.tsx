import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { getProfile } from '../../services/family';
import MemberCard from '../../components/family/MemberCard';
import type { FamilyProfileResponse } from '../../types/api';
import { useAuthStore } from '../../store/authStore';

export default function FamilyProfileScreen() {
  const [profile, setProfile] = useState<FamilyProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuthStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const data = await getProfile();
    setProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {profile ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>{profile.household_name || 'My Family'}</Text>
            <Text style={styles.subtitle}>
              {profile.max_prep_minutes}min prep · {profile.dinners_per_cycle} dinners/{profile.planning_horizon_days} days
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Household Members</Text>
          <FlatList
            data={profile.members}
            renderItem={({ item }) => <MemberCard member={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No members yet. Start a chat to set up your family profile!
              </Text>
            }
          />
        </>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No family profile yet. Start chatting to set one up!
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textInverse,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textInverse,
    opacity: 0.8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    padding: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  logoutButton: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
