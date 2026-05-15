import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import StoryCard from '../../components/StoryCard';
import { supabase } from '../../lib/supabase';

interface Story {
  id: string | number;
  author_id: string; 
  author_username: string;
  content: string;
  mood: string;
  image_url: string | null;
  created_at: string;
  comments?: { count: number }[];
}

export default function HomeFeed() {
  const [stories, setStories] = useState<Story[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh when the user navigates to the Home tab
  useFocusEffect(
    useCallback(() => {
      fetchAlgorithmicFeed();
    }, [])
  );

  async function fetchAlgorithmicFeed() {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get Following List for the algorithm
      const { data: following } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = following?.map(f => f.following_id) || [];

      // 2. Fetch Stories with counts
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id, author_id, author_username, content, mood, image_url, created_at,
          comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // 3. THE ALGORITHM: Weighted Sort
        // Priority: 1. People you follow | 2. Newest | 3. Engagement (Comments)
        const algorithmicSort = (data as any[]).sort((a, b) => {
          const aFollowed = followingIds.includes(a.author_id) ? 1 : 0;
          const bFollowed = followingIds.includes(b.author_id) ? 1 : 0;
          
          if (aFollowed !== bFollowed) return bFollowed - aFollowed;
          
          // Secondary sort: Engagement weight
          const aWeight = (a.comments?.[0]?.count || 0) * 2;
          const bWeight = (b.comments?.[0]?.count || 0) * 2;
          return bWeight - aWeight;
        });

        setStories(algorithmicSort);
      }
    } catch (err) {
      console.error('Algorithm error:', err);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lore</Text>
          <Text style={styles.headerSubtitle}>Authentic Storytelling</Text>
        </View>
      </View>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <StoryCard 
            id={item.id}
            authorId={item.author_id}
            author={item.author_username} 
            content={item.content}
            imageUrl={item.image_url ?? undefined} 
            mood={item.mood} 
            commentCount={item.comments?.[0]?.count || 0}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAlgorithmicFeed} tintColor="#fff" />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1.5 },
  headerSubtitle: { color: '#666', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  listContent: { paddingBottom: 100 },
});