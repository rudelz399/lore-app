import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 30, paddingTop: 60 }}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.text}>
        By using Lore, you agree to post authentic content. Harassment, hate speech, 
        or bot-generated spam will result in an immediate deletion of your identity. 
        Lore is a space for human connection.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Accept & Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Reuse styles from privacy.tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { color: '#666', lineHeight: 22, fontSize: 16 },
  button: { marginTop: 40, backgroundColor: '#111', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff' }
});