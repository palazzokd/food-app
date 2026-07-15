import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState, Tag } from '../../components/ui';
import PressableScale from '../../components/ui/PressableScale';
import { useDataStore } from '../../store/dataStore';
import { colors } from '../../theme/colors';
import { recipeGlyph, recipeTint } from '../../theme/recipeVisuals';
import type { RecipeSummary } from '../../types/api';

const FILTERS = ['All', 'Breakfast', 'Lunch', 'Dinner', '⭐ Favorites'];

export default function RecipeLibraryScreen({ navigation }: any) {
  const { recipes, loadRecipes, toggleRecipeFavorite, loading } = useDataStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  const filtered = recipes.filter((r) => {
    if (filter === '⭐ Favorites' && !r.is_favorite) return false;
    if (filter !== 'All' && filter !== '⭐ Favorites' && r.category !== filter.toLowerCase())
      return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const renderRecipe = ({ item }: { item: RecipeSummary }) => (
    <PressableScale
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
    >
      <View style={[styles.tile, { backgroundColor: recipeTint(item.title) }]}>
        <Text style={styles.tileGlyph}>{recipeGlyph(item.cuisine, item.category)}</Text>
      </View>
      <View style={styles.recipeBody}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity
            onPress={() => toggleRecipeFavorite(item.id, !item.is_favorite)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={item.is_favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={item.is_favorite ? colors.warm : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.recipeMeta}>
          {[item.cuisine, item.protein, item.total_minutes ? `${item.total_minutes} min` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <View style={styles.tagRow}>
          {item.nutrition_tags.map((t) => (
            <Tag key={t} label={t.replace('_', ' ')} />
          ))}
        </View>
      </View>
    </PressableScale>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search recipes..."
        placeholderTextColor={colors.placeholder}
        value={search}
        onChangeText={setSearch}
      />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={filter === f ? styles.filterTextActive : styles.filterText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRecipes} />}
        ListEmptyComponent={
          <EmptyState
            emoji="🍽️"
            message="No recipes yet. Ask the AI to create one — it saves recipes here automatically."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 14,
    marginBottom: 8,
    fontSize: 14,
    color: colors.charcoal,
  },
  filters: {
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  filterPill: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: colors.forest,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forest,
  },
  filterTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  list: {
    padding: 14,
    paddingTop: 4,
  },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tileGlyph: {
    fontSize: 26,
  },
  recipeBody: {
    flex: 1,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.charcoal,
    flex: 1,
    marginRight: 8,
  },
  recipeMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
