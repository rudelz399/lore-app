import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Grid, Heart, LogOut } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams(); 
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setCurrentUser(authUser);

      const targetId = userId || authUser?.id;
      if (!targetId) return;

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', targetId).single();
      setProfile(profileData);

      if (authUser && targetId !== authUser.id) {
        const { data } = await supabase.from('followers').select('id').eq('follower_id', authUser.id).eq('following_id', targetId).maybeSingle();
        setIsFollowing(!!data);
      }

      const { count: fers } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', targetId);
      const { count: fing } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', targetId);
      setStats({ followers: fers || 0, following: fing || 0 });

      if (activeTab === 'posts') {
        const { data } = await supabase.from('stories').select('id, image_url').eq('author_id', targetId).order('created_at', { ascending: false });
        setItems(data || []);
      } else {
        const { data } = await supabase.from('reactions').select('stories(id, image_url)').eq('user_id', targetId);
        setItems(data?.map(d => d.stories).filter(Boolean) || []);
      }
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login'); // Matches app/auth/login.tsx
        } 
      }
    ]);
  };

  // --- CRITICAL FIX START ---
  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.gridBox} 
      onPress={() => {
        try {
          if (item?.id) {
            // Using object syntax is safer for dynamic routes
            router.push({
              pathname: "/story/[id]",
              params: { id: item.id }
            });
          }
        } catch (e) {
          console.error("Navigation failed. Ensure app/story/[id].tsx exists.", e);
        }
      }}
    >
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
        style={styles.gridImage} 
      />
    </TouchableOpacity>
  );
  // --- CRITICAL FIX END ---

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.avatar} />
          {(!userId || userId === currentUser?.id) && (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <LogOut color="#FF3B30" size={24} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.username}>@{profile?.username || 'user'}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statNumber}>{stats.following}</Text><Text style={styles.statLabel}>Following</Text></View>
          <View style={styles.statItem}><Text style={styles.statNumber}>{stats.followers}</Text><Text style={styles.statLabel}>Followers</Text></View>
        </View>
        {(!userId || userId === currentUser?.id) ? (
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Edit Profile</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionBtn, isFollowing ? styles.followingBtn : styles.followBtn]} 
            onPress={async () => {
              if (isFollowing) {
                await supabase.from('followers').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id);
                setIsFollowing(false);
              } else {
                await supabase.from('followers').insert([{ follower_id: currentUser.id, following_id: profile.id }]);
                setIsFollowing(true);
              }
              loadProfileData();
            }}
          >
            <Text style={[styles.actionBtnText, !isFollowing && { color: '#000' }]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'posts' && styles.activeTab]} onPress={() => setActiveTab('posts')}>
          <Grid color={activeTab === 'posts' ? '#fff' : '#666'} size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'liked' && styles.activeTab]} onPress={() => setActiveTab('liked')}>
          <Heart color={activeTab === 'liked' ? '#fff' : '#666'} size={22} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderGridItem}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.emptyText}>No stories yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { alignItems: 'center', paddingVertical: 20 },
  topRow: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { position: 'absolute', right: 25 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  username: { color: '#fff', fontSize: 18, fontWeight: '800', marginVertical: 15 },
  statsRow: { flexDirection: 'row', width: '60%', justifyContent: 'space-between', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statNumber: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#666', fontSize: 12 },
  actionBtn: { paddingHorizontal: 40, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  followBtn: { backgroundColor: '#00FF00', borderColor: '#00FF00' },
  followingBtn: { backgroundColor: '#1a1a1a' },
  actionBtnText: { color: '#fff', fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#fff' },
  gridContent: { paddingTop: 2 },
  gridBox: { width: COLUMN_WIDTH, height: COLUMN_WIDTH, padding: 1 },
  gridImage: { flex: 1, backgroundColor: '#111' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 }
});