import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import type { QuizOptions as QuizOptionsType } from '../../types/chat';

interface Props {
  quiz: QuizOptionsType;
  onSelect: (optionId: string, label: string) => void;
}

export default function QuizOptions({ quiz, onSelect }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleTap = (optionId: string, label: string) => {
    if (!quiz.allowMultiple) {
      onSelect(optionId, label);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  };

  const submitMultiple = () => {
    const chosen = quiz.options.filter((o) => selected.has(o.id));
    if (chosen.length === 0) return;
    onSelect(
      chosen.map((o) => o.id).join(','),
      chosen.map((o) => o.label).join(', ')
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>
        {quiz.question}
        {quiz.allowMultiple ? '  (select all that apply)' : ''}
      </Text>
      <View style={styles.optionsContainer}>
        {quiz.options.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handleTap(option.id, option.label)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {isSelected ? '✓ ' : ''}
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {quiz.allowMultiple ? (
        <TouchableOpacity
          style={[styles.doneButton, selected.size === 0 && styles.doneButtonDisabled]}
          onPress={submitMultiple}
          disabled={selected.size === 0}
        >
          <Text style={styles.doneButtonText}>
            {selected.size === 0 ? 'Select options above' : `Done (${selected.size} selected)`}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  question: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
  optionTextSelected: {
    color: colors.white,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  doneButtonDisabled: {
    backgroundColor: colors.border,
  },
  doneButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
