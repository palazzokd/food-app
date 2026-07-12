import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import type { ChatMessage } from '../../types/chat';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.aiBubble,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.userBubbleText,
  },
  aiText: {
    color: colors.aiBubbleText,
  },
});
