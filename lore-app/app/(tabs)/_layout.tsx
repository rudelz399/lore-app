import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, SquarePlus, UserRound } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#1a1a1a',
          height: 65,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#444',
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={24} strokeWidth={1.5} />,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => <Search color={color} size={24} strokeWidth={1.5} />,
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color }) => <SquarePlus color={color} size={24} strokeWidth={1.5} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <UserRound color={color} size={24} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}