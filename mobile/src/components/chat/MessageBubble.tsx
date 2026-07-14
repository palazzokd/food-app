import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
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
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{message.content}</Markdown>
        )}
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
  userText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.userBubbleText,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.aiBubbleText,
  },
  strong: {
    fontWeight: '700',
    color: colors.forest,
  },
  em: {
    fontStyle: 'italic',
  },
  heading1: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.forest,
    marginTop: 6,
    marginBottom: 4,
  },
  heading2: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.forest,
    marginTop: 6,
    marginBottom: 4,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.forest,
    marginTop: 6,
    marginBottom: 2,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginBottom: 3,
  },
  code_inline: {
    backgroundColor: colors.mist,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontSize: 14,
  },
  fence: {
    backgroundColor: colors.mist,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  blockquote: {
    backgroundColor: colors.mist,
    borderLeftWidth: 3,
    borderLeftColor: colors.sage,
    paddingLeft: 10,
    marginVertical: 4,
  },
  hr: {
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginVertical: 6,
  },
  th: {
    padding: 6,
    fontWeight: '700',
  },
  td: {
    padding: 6,
  },
});
