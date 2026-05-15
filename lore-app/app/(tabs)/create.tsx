import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Image, ActivityIndicator, Alert, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';
import { Camera } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const MOODS = ['Ethereal', 'Gloom', 'Neon', 'Vintage', 'Solitude'];

export default function CreateStory() {
  const [story, setStory] = useState('');
  const [selectedMood, setSelectedMood] = useState('Ethereal');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const processImageForLore = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], 
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error("Compression failed:", error);
      return uri;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5,
    });

    if (!result.canceled) {
      const compressedUri = await processImageForLore(result.assets[0].uri);
      setImage(compressedUri);
    }
  };

  const handlePost = async () => {
    if (story.trim().length < 5) {
      Alert.alert("Brief Note", "Your lore needs more substance.");
      return;
    }
    setUploading(true);

    try {
      // 1. Get Session User
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("You must be logged in to etch lore.");

      // 2. Get Profile Data (to ensure the account exists in public.profiles)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw new Error("Please complete your profile setup first.");

      let finalImageUrl = null;

      // 3. Handle Image Upload if present
      if (image) {
        const fileExt = image.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const formData = new FormData();
        formData.append('file', {
          uri: image,
          name: fileName,
          type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        } as any);

        const { error: storageError } = await supabase.storage
          .from('lore-images')
          .upload(fileName, formData);

        if (storageError) throw storageError;

        const { data: publicUrlData } = supabase.storage
          .from('lore-images')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrlData.publicUrl;
      }

      // 4. Insert Story with author_id matching the UID for RLS
      const { error: insertError } = await supabase
        .from('stories')
        .insert([{ 
          author_id: user.id, // Must match auth.uid()
          author_username: profile.username, 
          content: story.trim(), 
          mood: selectedMood,
          image_url: finalImageUrl 
        }]);

      if (insertError) throw insertError;

      Alert.alert("Success", "The story has been etched.");
      setStory('');
      setImage(null);
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error("Post Error:", error);
      Alert.alert("Post Failed", error.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Lore</Text>
        <TouchableOpacity 
          style={[styles.postButton, (uploading || story.length < 5) && { opacity: 0.3 }]} 
          onPress={handlePost}
          disabled={uploading || story.length < 5}
        >
          {uploading ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.postButtonText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>VISUAL</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Camera color="#333" size={30} strokeWidth={1} />
              <Text style={styles.placeholderText}>Tap to add</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>MOOD</Text>
        <View style={styles.moodContainer}>
          {MOODS.map((mood) => (
            <TouchableOpacity 
              key={mood} 
              onPress={() => setSelectedMood(mood)}
              style={[styles.moodBadge, selectedMood === mood && styles.moodActive]}
            >
              <Text style={[styles.moodText, selectedMood === mood && styles.moodTextActive]}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>CONTENT</Text>
        <TextInput
          multiline
          placeholder="What's the story?"
          placeholderTextColor="#333"
          style={styles.input}
          value={story}
          onChangeText={setStory}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', marginVertical: 20 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900' },
  postButton: { backgroundColor: '#fff', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 25 },
  postButtonText: { color: '#000', fontWeight: 'bold' },
  form: { padding: 20 },
  label: { color: '#222', fontSize: 9, fontWeight: 'bold', marginBottom: 15, letterSpacing: 2 },
  imagePicker: { width: '100%', height: width * 0.8, backgroundColor: '#030303', borderRadius: 15, borderWidth: 1, borderColor: '#111', marginBottom: 30, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#222', marginTop: 10, fontSize: 12 },
  moodContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
  moodBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: '#111', marginRight: 8, marginBottom: 8 },
  moodActive: { borderColor: '#444', backgroundColor: '#080808' },
  moodText: { color: '#333', fontSize: 13 },
  moodTextActive: { color: '#fff' },
  input: { color: '#fff', fontSize: 17, lineHeight: 24, minHeight: 150, textAlignVertical: 'top', paddingBottom: 100 }
});