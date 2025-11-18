import React from 'react';
import { Menu, useTheme } from 'react-native-paper';

export type SortOption = 'date' | 'title' | 'progress';

interface BookmarkSortMenuProps {
  visible: boolean;
  onDismiss: () => void;
  anchor: React.ReactNode;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: string }[] = [
  { value: 'date', label: 'Date Added', icon: 'calendar' },
  { value: 'title', label: 'Title (A-Z)', icon: 'sort-alphabetical-ascending' },
  { value: 'progress', label: 'Reading Progress', icon: 'progress-check' },
];

export default function BookmarkSortMenu({
  visible,
  onDismiss,
  anchor,
  currentSort,
  onSortChange,
}: BookmarkSortMenuProps) {
  const theme = useTheme();

  return (
    <Menu visible={visible} onDismiss={onDismiss} anchor={anchor} anchorPosition="bottom">
      {sortOptions.map((option) => (
        <Menu.Item
          key={option.value}
          onPress={() => {
            onSortChange(option.value);
            onDismiss();
          }}
          title={option.label}
          leadingIcon={option.icon}
          trailingIcon={currentSort === option.value ? 'check' : undefined}
        />
      ))}
    </Menu>
  );
}
