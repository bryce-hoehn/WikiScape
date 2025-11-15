import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useRef, useState } from 'react';
import {
  RefreshControl,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useBookmarkToggle } from '../../hooks';
import { FeedProps, RecommendationItem } from '../../types/components';
import RecommendationCard from '../article/RecommendationCard';
import ScrollToTopFAB from '../common/ScrollToTopFAB';
import LoadingFooter from './LoadingFooter';

export default function Feed({
  data,
  loading,
  refreshing,
  onRefresh,
  loadMore,
  renderEmptyState,
  keyExtractor,
  renderItem,
}: FeedProps) {
  const theme = useTheme();
  const flashListRef = useRef<any>(null);
  const { handleBookmarkToggle, isBookmarked } = useBookmarkToggle();
  const [fabVisible, setFabVisible] = useState(false);

  const defaultRenderItem = useCallback(({ item, index }: { item: RecommendationItem; index: number }) => (
    <RecommendationCard
      item={item}
      index={index}
      isBookmarked={isBookmarked}
      onBookmarkToggle={handleBookmarkToggle}
    />
  ), [isBookmarked, handleBookmarkToggle]);

  const renderFooter = useCallback(() => (
    <LoadingFooter loading={loading && data.length > 0} />
  ), [loading, data.length]);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        ref={flashListRef}
        data={data}
        renderItem={renderItem || defaultRenderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          flexGrow: 1,
          gap: 8,
          ...(data.length === 0 && { justifyContent: 'center' })
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        onScroll={(event) => {
          const yOffset = event.nativeEvent.contentOffset.y;
          setFabVisible(yOffset > 300);
        }}
        scrollEventThrottle={16}
      />
      <ScrollToTopFAB
        scrollRef={flashListRef}
        visible={fabVisible}
      />
    </View>
  );
}
