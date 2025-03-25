import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: 'HAVEN',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerTitle: 'Settings',
          headerRight: () => (
            <TouchableOpacity
              style={{
                backgroundColor: '#fff',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '500' }}>Save Changes</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
