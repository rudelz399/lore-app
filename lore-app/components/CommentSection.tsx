import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface Comment {
  id: string;
  author_username: string;
  content: string;
  created_at: string;
}

export default function CommentSection({ storyId, user }: { storyId: string | number, user: any }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  }, [storyId]);

  useEffect(() => {
    const executeFetch = async () => {
      await fetchComments();
    };
    executeFetch();
  }, [fetchComments]);

  async function postComment() {
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from('comments').insert([{
      story_id: storyId,
      user_id: user.id,
      author_username: user.user_metadata.username || 'anonymous',
      content: newComment.trim()
    }]);

    if (!error) {
      setNewComment('');
      fetchComments();
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Text style={styles.commentUser}>{item.author_username}</Text>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a dialogue..."
          placeholderTextColor="#666"
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity onPress={postComment}>
          <Text style={styles.postBtn}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 300, padding: 10, backgroundColor: '#050505' },
  commentItem: { marginBottom: 12 },
  commentUser: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
  commentText: { color: '#ccc', fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 0.5, borderColor: '#222', paddingTop: 10 },
  input: { flex: 1, color: '#fff', fontSize: 14, padding: 8 },
  postBtn: { color: '#00FF00', fontWeight: 'bold', paddingHorizontal: 10 }
});