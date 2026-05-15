import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 30, paddingTop: 60 }}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.text}>
        At Lore, your existence is your own. We collect minimal data (email and username) 
        solely to maintain your identity. We do not sell your data to third parties. 
        Your stories are stored securely via Supabase.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { color: '#666', lineHeight: 22, fontSize: 16 },
  button: { marginTop: 40, backgroundColor: '#111', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff' }
});