import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import type { QuizOptions as QuizOptionsType } from '../../types/chat';

interface Props {
  quiz: QuizOptionsType;
  onSelect: (optionId: string, label: string) => void;
}

export default function QuizOptions({ quiz, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{quiz.question}</Text>
      <View style={styles.optionsContainer}>
        {quiz.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={() => onSelect(option.id, option.label)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
});
