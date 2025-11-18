import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text, TextInput, useTheme } from 'react-native-paper';

interface BookmarkTagEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function BookmarkTagEditor({ tags, onTagsChange }: BookmarkTagEditorProps) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' || e.nativeEvent.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
        Tags
      </Text>
      <View style={styles.tagContainer}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            onClose={() => handleRemoveTag(tag)}
            style={[styles.chip, { backgroundColor: theme.colors.primaryContainer, height: 32 }]}
            textStyle={{ color: theme.colors.onPrimaryContainer }}
          >
            {tag}
          </Chip>
        ))}
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          onKeyPress={handleKeyPress}
          onSubmitEditing={handleAddTag}
          placeholder="Add tag..."
          mode="flat"
          style={styles.input}
          dense
          right={
            inputValue.trim() ? (
              <TextInput.Icon
                icon="plus-circle"
                onPress={handleAddTag}
                forceTextInputFocus={false}
              />
            ) : undefined
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    minWidth: 120,
    maxWidth: 200,
  },
});
