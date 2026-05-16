import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Story = {
  id: string | number;
  author_id: string;
  author_username: string;
  content: string;
  mood: string;
  image_url?: string | null;
  created_at: string;
};

export default function StoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadStory() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('id, author_id, author_username, content, mood, image_url, created_at')
          .eq('id', id)
          .single();

        if (error) {
          console.warn('Story load error:', error);
          setStory(null);
        } else {
          setStory(data as Story);
        }
      } catch (err) {
        console.warn('Story load exception:', err);
        setStory(null);
      } finally {
        setLoading(false);
      }
    }

    loadStory();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Story not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: 'Story' }} />
      {story.image_url ? <Image source={{ uri: story.image_url }} style={styles.image} /> : null}
      <Text style={styles.author}>@{story.author_username}</Text>
      <Text style={styles.mood}>{story.mood}</Text>
      <Text style={styles.body}>{story.content}</Text>
      <Text style={styles.timestamp}>{new Date(story.created_at).toLocaleString()}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  contentContainer: { padding: 20 },
  centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 260, borderRadius: 18, marginBottom: 20, backgroundColor: '#111' },
  author: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  mood: { color: '#999', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },
  body: { color: '#eee', fontSize: 16, lineHeight: 24, marginBottom: 18 },
  timestamp: { color: '#666', fontSize: 12 },
  errorText: { color: '#ff5a5f', fontSize: 16 },
});
