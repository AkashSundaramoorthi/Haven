import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [alertVolume, setAlertVolume] = useState(80);
  const [locationSharing, setLocationSharing] = useState(true);

  return (
    <ScrollView style={styles.container}>
      {/* Notification Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="notifications" size={24} color="#fff" />
          <Text style={styles.sectionTitle}>Notification Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>Receive alerts and notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Alert Volume</Text>
            <Text style={styles.settingDescription}>Set the volume for emergency alerts</Text>
          </View>
          <View style={styles.sliderContainer}>
            <MaterialIcons name="volume-down" size={20} color="#666" />
            <Slider
              style={styles.slider}
              value={alertVolume}
              onValueChange={setAlertVolume}
              minimumValue={0}
              maximumValue={100}
              minimumTrackTintColor="#81b0ff"
              maximumTrackTintColor="#666"
              thumbTintColor="#fff"
            />
            <Text style={styles.volumeText}>{Math.round(alertVolume)}%</Text>
          </View>
        </View>
      </View>

      {/* Privacy Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="security" size={24} color="#fff" />
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Location Sharing</Text>
            <Text style={styles.settingDescription}>Allow sharing your location in emergency</Text>
          </View>
          <Switch
            value={locationSharing}
            onValueChange={setLocationSharing}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={locationSharing ? '#fff' : '#f4f3f4'}
          />
        </View>

        <Text style={styles.privacyNote}>
          Your privacy is important. Location data is only shared during emergencies and is never stored or used for any other purpose.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    color: '#666',
    fontSize: 14,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    marginLeft: 'auto',
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
    width: 150,
  },
  volumeText: {
    color: '#fff',
    minWidth: 45,
    textAlign: 'right',
    fontSize: 14,
  },
  privacyNote: {
    color: '#666',
    fontSize: 14,
    padding: 16,
    lineHeight: 20,
  },
}); 