import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Card, CardTitle, Tag } from '../../components/ui';
import { fetchRecipe } from '../../services/modules';
import { downloadAndSharePdf } from '../../services/pdf';
import { useDataStore } from '../../store/dataStore';
import { colors } from '../../theme/colors';
import type { RecipeDetail } from '../../types/api';

export default function RecipeDetailScreen({ route }: any) {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [sharing, setSharing] = useState(false);
  const { toggleRecipeFavorite } = useDataStore();

  useEffect(() => {
    fetchRecipe(recipeId).then(setRecipe).catch(() => {});
  }, [recipeId]);

  if (!recipe) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.forest} size="large" />
      </View>
    );
  }

  const sharePdf = async () => {
    setSharing(true);
    try {
      await downloadAndSharePdf(
        `/api/recipes/${recipe.id}/pdf`,
        `${recipe.title.replace(/\s+/g, '_')}.pdf`
      );
    } catch (e: any) {
      Alert.alert('PDF export failed', e.message);
    } finally {
      setSharing(false);
    }
  };

  const onToggleFavorite = async () => {
    const next = !recipe.is_favorite;
    setRecipe({ ...recipe, is_favorite: next });
    await toggleRecipeFavorite(recipe.id, next);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.meta}>
        {[
          recipe.category,
          recipe.cuisine,
          recipe.protein,
          recipe.active_minutes ? `${recipe.active_minutes} min active` : null,
          recipe.total_minutes ? `${recipe.total_minutes} min total` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <View style={styles.tagRow}>
        {recipe.nutrition_tags.map((t) => (
          <Tag key={t} label={t.replace('_', ' ')} />
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onToggleFavorite}>
          <Text style={styles.actionText}>
            {recipe.is_favorite ? '♥ Favorited' : '♡ Favorite'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={sharePdf} disabled={sharing}>
          <Text style={styles.actionTextPrimary}>
            {sharing ? 'Preparing…' : '📄 Share PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <Card>
        <CardTitle>Ingredients</CardTitle>
        {recipe.ingredients.map((ing, i) => (
          <Text key={i} style={styles.bodyText}>
            •  {ing.quantity ? `${ing.quantity} ` : ''}
            {ing.item}
            {ing.store_hint ? `  (${ing.store_hint})` : ''}
          </Text>
        ))}
      </Card>

      <Card>
        <CardTitle>Method</CardTitle>
        {recipe.instructions.map((step, i) => (
          <Text key={i} style={styles.step}>
            {i + 1}.  {step}
          </Text>
        ))}
      </Card>

      {recipe.toddler_notes ? (
        <Card>
          <CardTitle>Toddler Adaptation</CardTitle>
          <Text style={styles.bodyText}>{recipe.toddler_notes}</Text>
        </Card>
      ) : null}

      {recipe.infant_notes ? (
        <Card>
          <CardTitle>Infant Finger Foods</CardTitle>
          <Text style={styles.bodyText}>{recipe.infant_notes}</Text>
        </Card>
      ) : null}

      {recipe.night2_notes ? (
        <Card>
          <CardTitle>Night 2 Refresh</CardTitle>
          <Text style={styles.bodyText}>{recipe.night2_notes}</Text>
        </Card>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.charcoal,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: {
    color: colors.forest,
    fontWeight: '600',
    fontSize: 13,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: colors.forest,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionTextPrimary: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  bodyText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
    marginBottom: 4,
  },
  step: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
    marginBottom: 8,
  },
});
