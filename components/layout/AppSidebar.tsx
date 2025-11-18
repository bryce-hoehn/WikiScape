import { fetchRandomArticle } from '@/api';
import { SPACING } from '@/constants/spacing';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Divider, useTheme } from 'react-native-paper';
import SearchBar from '../common/SearchBar';
import TrendingSection from '../search/TrendingSection';

export default function AppSidebar() {
  const theme = useTheme();
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRandomArticle = async () => {
    setLoadingRandom(true);
    try {
      const response = await fetchRandomArticle();
      if (response?.article?.title) {
        router.push(`/article/${encodeURIComponent(response.article.title)}`);
      }
    } catch (error) {
      console.error('Failed to fetch random article:', error);
    } finally {
      setLoadingRandom(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/article/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // 20dp gap (24dp - 4dp)
  return (
    <View style={{ gap: SPACING.lg + SPACING.xs }}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearchSubmit}
        onIconPress={handleSearchSubmit}
      />

      {/* Random Article Button */}
      <Button
        mode="outlined"
        icon="dice-5"
        onPress={handleRandomArticle}
        loading={loadingRandom}
        disabled={loadingRandom}
        style={{ borderRadius: theme.roundness * 2 }} // 8dp equivalent (4dp * 2) - MD3 doesn't specify 24dp, using 8dp
        contentStyle={{ paddingVertical: SPACING.xs / 2 }}
      >
        Random Article
      </Button>

      <Divider />

      {/* Trending Articles */}
      <TrendingSection />
    </View>
  );
}
