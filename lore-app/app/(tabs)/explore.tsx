import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Image, Dimensions, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 45) / 2;

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [lore, setLore] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all lore initially, or filter based on search
  const fetchLore = async (query = '') => {
    setLoading(true);
    try {
      let request = supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (query.length > 0) {
        // This searches BOTH the mood column and the author_username column
        request = request.or(`mood.ilike.%${query}%,author_username.ilike.%${query}%`);
      }

      const { data, error } = await request.limit(20);

      if (error) throw error;
      setLore(data || []);
    } catch (error) {
      console.error("Explore Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLore(searchQuery);
    }, 500); // Wait 500ms after user stops typing to hit the database

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <SearchIcon color="#666" size={20} />
          <TextInput 
            placeholder="Search by mood or @user..." 
            placeholderTextColor="#444"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color="#666" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          {searchQuery ? `SEARCHING: ${searchQuery.toUpperCase()}` : 'TRENDING LORE'}
        </Text>

        {loading ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 50 }} />
        ) : lore.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No lore found in this frequency.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {lore.map((item) => (
              <TouchableOpacity key={item.id} style={styles.card}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: '#050505' }]} />
                )}
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardMood}>{item.mood}</Text>
                  <Text style={styles.cardAuthor}>{item.author_username}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: '#0a0a0a', 
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a'
  },
  searchInput: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 15 },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 100 },
  sectionTitle: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    width: COLUMN_WIDTH, 
    height: 240, 
    backgroundColor: '#111', 
    borderRadius: 15, 
    marginBottom: 15, 
    overflow: 'hidden' 
  },
  cardImage: { width: '100%', height: '100%', opacity: 0.6 },
  cardOverlay: { position: 'absolute', bottom: 15, left: 15, right: 15 },
  cardMood: { color: '#fff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
  cardAuthor: { color: '#fff', fontSize: 13, fontWeight: '400', opacity: 0.8 },
  emptyState: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#333', fontSize: 14 }
});