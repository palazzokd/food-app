import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardTitle, EmptyState } from '../../components/ui';
import PressableScale from '../../components/ui/PressableScale';
import { downloadAndSharePdf } from '../../services/pdf';
import { useDataStore } from '../../store/dataStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { GroceryItem } from '../../types/api';

export default function GroceryListScreen({ navigation }: any) {
  const { groceryList, loadGroceryList, toggleGroceryItem, loading } = useDataStore();
  const [sharing, setSharing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGroceryList();
    }, [])
  );

  const sharePdf = async () => {
    if (!groceryList) return;
    setSharing(true);
    try {
      await downloadAndSharePdf(`/api/grocery/${groceryList.id}/pdf`, 'grocery_list.pdf');
    } catch (e: any) {
      Alert.alert('PDF export failed', e.message);
    } finally {
      setSharing(false);
    }
  };

  const byStore = new Map<string, GroceryItem[]>();
  for (const item of groceryList?.items ?? []) {
    const store = item.store || 'Other';
    const list = byStore.get(store) ?? [];
    list.push(item);
    byStore.set(store, list);
  }

  const total = groceryList?.items.length ?? 0;
  const checked = groceryList?.items.filter((i) => i.is_checked).length ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadGroceryList} />}
    >
      {groceryList ? (
        <>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.heading}>{groceryList.title || 'Grocery List'}</Text>
              <Text style={styles.subheading}>
                {checked}/{total} items · {byStore.size} stores
              </Text>
            </View>
            <TouchableOpacity style={styles.pdfBtn} onPress={sharePdf} disabled={sharing}>
              <Ionicons name="share-outline" size={15} color={colors.forest} />
              <Text style={styles.pdfBtnText}>{sharing ? 'Preparing…' : 'PDF'}</Text>
            </TouchableOpacity>
          </View>

          {total > 0 ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(checked / total) * 100}%` }]} />
            </View>
          ) : null}

          {groceryList.strategy_note ? (
            <View style={styles.strategy}>
              <Text style={styles.strategyTitle}>🕐 Shopping Strategy</Text>
              <Text style={styles.strategyText}>{groceryList.strategy_note}</Text>
            </View>
          ) : null}

          {[...byStore.entries()].map(([store, items]) => (
            <Card key={store}>
              <CardTitle>{store}</CardTitle>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemRow}
                  onPress={() => toggleGroceryItem(item.id, !item.is_checked)}
                >
                  <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
                    {item.is_checked ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemName, item.is_checked && styles.itemChecked]}>
                      {item.name}
                      {item.quantity ? ` — ${item.quantity}` : ''}
                    </Text>
                    {item.deal_note ? (
                      <Text style={styles.dealNote}>{item.deal_note}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          ))}
        </>
      ) : (
        <EmptyState
          emoji="🛒"
          message="No grocery list yet. Ask the AI to build one from your meal plan."
        />
      )}

      <PressableScale
        style={styles.aiButton}
        onPress={() =>
          navigation.navigate('Chat', {
            initialPrompt: groceryList
              ? "Let's update my grocery list. Show me what's on it and ask me what to add or remove."
              : "Build my grocery list from this week's meal plan, grouped by store, and flag any deals.",
            promptKey: Date.now(),
          })
        }
      >
        <Ionicons name="sparkles" size={16} color={colors.white} style={styles.aiButtonIcon} />
        <Text style={styles.aiButtonText}>
          {groceryList ? 'Update list with AI' : 'Build grocery list with AI'}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.forest,
  },
  subheading: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pdfBtn: {
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pdfBtnText: {
    color: colors.forest,
    fontWeight: '600',
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mist,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.sage,
  },
  strategy: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  strategyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.amber,
    marginBottom: 4,
  },
  strategyText: {
    fontSize: 12,
    color: colors.charcoal,
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 14,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: colors.charcoal,
  },
  itemChecked: {
    color: '#BBB',
    textDecorationLine: 'line-through',
  },
  dealNote: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amber,
    marginTop: 2,
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
