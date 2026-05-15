import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp() {
    if (form.password !== form.confirmPassword) return Alert.alert("Error", "Passwords mismatch");
    if (!agreed) return Alert.alert("Error", "Must accept Terms & Privacy");

    setLoading(true);
    // Standardizing branding to echo/
    const echoUsername = `echo/${form.username.toLowerCase().trim()}`;

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          username: echoUsername,
        }
      }
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Identity Created", "Check your email to verify.");
      router.replace('/auth/login');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={styles.title}>New Identity</Text>
        
        <View style={styles.row}>
          <TextInput placeholder="First Name" placeholderTextColor="#333" style={[styles.input, {flex:1, marginRight:10}]} onChangeText={(v) => setForm({...form, firstName: v})} />
          <TextInput placeholder="Last Name" placeholderTextColor="#333" style={[styles.input, {flex:1}]} onChangeText={(v) => setForm({...form, lastName: v})} />
        </View>

        <TextInput placeholder="Username (e.g. sam)" placeholderTextColor="#333" style={styles.input} autoCapitalize="none" onChangeText={(v) => setForm({...form, username: v})} />
        <TextInput placeholder="Email" placeholderTextColor="#333" style={styles.input} autoCapitalize="none" onChangeText={(v) => setForm({...form, email: v})} />
        <TextInput placeholder="Password" placeholderTextColor="#333" secureTextEntry style={styles.input} onChangeText={(v) => setForm({...form, password: v})} />
        <TextInput placeholder="Confirm Password" placeholderTextColor="#333" secureTextEntry style={styles.input} onChangeText={(v) => setForm({...form, confirmPassword: v})} />

        <View style={styles.switchRow}>
          <Switch value={agreed} onValueChange={setAgreed} trackColor={{ false: "#222", true: "#fff" }} />
          <Text style={styles.switchText}>I agree to the <Text style={styles.link}>Terms</Text> & <Text style={styles.link}>Privacy</Text></Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryButtonText}>Initialize</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.supportFooter} 
          onPress={() => Linking.openURL('mailto:pecoindustries1@gmail.com')}
        >
          <Text style={styles.supportText}>
            Having issues? <Text style={styles.supportLink}>Contact Support</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  row: { flexDirection: 'row', marginBottom: 5 },
  input: { backgroundColor: '#050505', color: '#fff', padding: 18, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#111' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  switchText: { color: '#666', marginLeft: 10, fontSize: 12 },
  link: { color: '#fff', textDecorationLine: 'underline' },
  primaryButton: { backgroundColor: '#fff', padding: 18, borderRadius: 30, alignItems: 'center' },
  primaryButtonText: { color: '#000', fontWeight: 'bold' },
  secondaryButton: { marginTop: 25, alignItems: 'center' },
  secondaryButtonText: { color: '#666', fontSize: 13 },
  supportFooter: { marginTop: 40, alignItems: 'center' },
  supportText: { color: '#333', fontSize: 12 },
  supportLink: { color: '#666', textDecorationLine: 'underline' }
});