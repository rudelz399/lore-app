import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, Share, Alert, Modal, Pressable } from 'react-native';
import { Heart, MessageCircle, Share2, X, UserPlus, UserCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router'; 
import { supabase } from '../lib/supabase';
import CommentSection from './CommentSection';

const { width, height } = Dimensions.get('window');

interface StoryProps {
  id: string | number;
  authorId: string;
  author: string;
  content: string;
  imageUrl?: string;
  mood?: string;
  commentCount?: number;
}

export default function StoryCard({ id, authorId, author, content, imageUrl, mood, commentCount = 0 }: StoryProps): React.JSX.Element {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState<any>(null);

  const setupCard = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      if (!authUser) return;

      const { count } = await supabase.from('reactions').select('*', { count: 'exact', head: true }).eq('story_id', id);
      setLikesCount(count || 0);

      const { data: likeData } = await supabase.from('reactions').select('id').eq('story_id', id).eq('user_id', authUser.id).maybeSingle();
      setIsLiked(!!likeData);

      if (authUser.id !== authorId) {
        const { data: followData } = await supabase.from('followers').select('id').eq('follower_id', authUser.id).eq('following_id', authorId).maybeSingle();
        setIsFollowing(!!followData);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [id, authorId]);

  useEffect(() => {
    const executeSetup = async () => {
      await setupCard();
    };
    executeSetup();
  }, [setupCard]);

  const handleProfileNavigation = () => {
    // FIX: Using router.push with lowercase route
    router.push({
      pathname: '/profile',
      params: { userId: authorId }
    });
  };

  const handleFollow = async () => {
    if (!user) return Alert.alert("Lore", "Sign in to follow.");
    if (isFollowing) {
      await supabase.from('followers').delete().eq('follower_id', user.id).eq('following_id', authorId);
      setIsFollowing(false);
    } else {
      await supabase.from('followers').insert([{ follower_id: user.id, following_id: authorId }]);
      setIsFollowing(true);
    }
  };

  const handleLike = async () => {
    if (!user) return Alert.alert("Lore", "Sign in to react.");
    const previousLiked = isLiked;
    setIsLiked(!previousLiked);
    setLikesCount(prev => previousLiked ? prev - 1 : prev + 1);
    if (previousLiked) {
      await supabase.from('reactions').delete().eq('story_id', id).eq('user_id', user.id);
    } else {
      await supabase.from('reactions').insert([{ story_id: id, user_id: user.id }]);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorSection} onPress={handleProfileNavigation}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.author}>{author}</Text>
            {mood && <Text style={styles.moodText}>{mood}</Text>}
          </View>
        </TouchableOpacity>

        {user?.id !== authorId && (
          <TouchableOpacity style={[styles.followBtn, isFollowing && styles.followingBtn]} onPress={handleFollow}>
            {isFollowing ? <UserCheck color="#666" size={18} /> : <UserPlus color="#00FF00" size={18} />}
          </TouchableOpacity>
        )}
      </View>

      <Image source={{ uri: imageUrl || 'https://via.placeholder.com/400' }} style={styles.image} />

      <View style={styles.footer}>
        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.icon} onPress={handleLike}>
            <Heart color={isLiked ? "#FF3B30" : "#fff"} fill={isLiked ? "#FF3B30" : "none"} size={24} />
            <Text style={styles.countText}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon} onPress={() => setModalVisible(true)}>
            <MessageCircle color="#fff" size={24} />
            <Text style={styles.countText}>{commentCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon} onPress={() => Share.share({ message: content })}>
            <Share2 color="#fff" size={24} />
          </TouchableOpacity>
        </View>
        <Text style={styles.contentText} numberOfLines={3}>{content}</Text>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.dragHandle} />
              <View style={styles.titleRow}>
                <Text style={styles.sheetTitle}>Dialogues ({commentCount})</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X color="#666" size={20} /></TouchableOpacity>
              </View>
            </View>
            <CommentSection storyId={id} user={user} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 20, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  authorSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1a1a1a', marginRight: 10, borderWidth: 1, borderColor: '#333' },
  author: { color: '#fff', fontWeight: '700', fontSize: 15 },
  moodText: { color: '#666', fontSize: 10, textTransform: 'uppercase' },
  followBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0, 255, 0, 0.1)' },
  followingBtn: { backgroundColor: '#1a1a1a' },
  image: { width: width, height: width },
  footer: { padding: 15 },
  iconRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  icon: { marginRight: 22, flexDirection: 'row', alignItems: 'center' },
  countText: { color: '#fff', fontSize: 14, marginLeft: 6, fontWeight: '600' },
  contentText: { color: '#ddd', fontSize: 15, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  bottomSheet: { height: height * 0.75, backgroundColor: '#0a0a0a', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: { padding: 20 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { color: '#fff', fontSize: 16, fontWeight: '800' }
});