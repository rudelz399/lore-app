import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Access Denied", error.message);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>LORE</Text>
      <Text style={styles.tagline}>Welcome back.</Text>

      <TextInput 
        placeholder="Email" 
        placeholderTextColor="#333"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput 
        placeholder="Password" 
        placeholderTextColor="#333"
        secureTextEntry 
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryButtonText}>Enter</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/auth/signup')}>
        <Text style={styles.secondaryButtonText}>No account? Create Identity</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.supportFooter} 
        onPress={() => Linking.openURL('mailto:pecoindustries1@gmail.com')}
      >
        <Text style={styles.supportText}>
          Having issues? <Text style={styles.supportLink}>Contact Support</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 30 },
  logo: { color: '#fff', fontSize: 50, fontWeight: '900', textAlign: 'center', letterSpacing: -2 },
  tagline: { color: '#444', textAlign: 'center', marginBottom: 50, fontSize: 14 },
  input: { backgroundColor: '#050505', color: '#fff', padding: 18, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#111' },
  primaryButton: { backgroundColor: '#fff', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#000', fontWeight: 'bold' },
  secondaryButton: { marginTop: 25, alignItems: 'center' },
  secondaryButtonText: { color: '#666', fontSize: 13 },
  supportFooter: { marginTop: 40, alignItems: 'center' },
  supportText: { color: '#333', fontSize: 12 },
  supportLink: { color: '#666', textDecorationLine: 'underline' }
});