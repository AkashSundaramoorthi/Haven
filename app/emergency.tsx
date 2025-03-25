import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

export default function EmergencyScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Could not retrieve your location. Emergency features may be limited.');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg('Could not retrieve your location. Emergency features may be limited.');
      }
    })();
  }, []);

  const handleEmergencyCall = () => {
    // Implement actual emergency call functionality
    Alert.alert('Calling Emergency Services', 'Connecting to 911...');
  };

  const handleQuickAlert = () => {
    Alert.alert('Quick Alert Sent', 'Emergency alert has been sent to your contacts');
  };

  const handleSOS = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Emergency Alert',
        'Sending emergency alert to your contacts and emergency services...',
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to send emergency alert');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Location Error</Text>
          <Text style={styles.errorSubText}>{errorMsg}</Text>
        </View>
      )}
      
      <View style={styles.mainButtonContainer}>
        <TouchableOpacity style={styles.emergencyButton} onPress={handleSOS}>
          <Text style={styles.emergencyButtonText}>EMERGENCY</Text>
        </TouchableOpacity>
        <Text style={styles.buttonDescription}>
          Press the button in case of emergency
        </Text>
        <Text style={styles.subDescription}>
          This will alert your emergency contacts{'\n'}and share your current location.
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEmergencyCall}>
          <MaterialIcons name="phone" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Call Emergency Services</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleQuickAlert}>
          <MaterialIcons name="message" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Send Quick Alert Message</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <MaterialIcons name="location-on" size={24} color="#fff" />
          <Text style={styles.infoTitle}>Current Location</Text>
          <Text style={styles.infoText}>
            {location ? 'Location available' : 'Location data not available'}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <MaterialIcons name="mic" size={24} color="#fff" />
          <Text style={styles.infoTitle}>Voice Detection</Text>
          <Text style={styles.infoText}>
            Voice detection is turned off{'\n'}
            Enable in the header to activate voice commands
          </Text>
        </View>

        <View style={styles.contactsSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="people" size={24} color="#fff" />
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity>
              <MaterialIcons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactTitle}>Emergency Services</Text>
            <Text style={styles.contactInfo}>911</Text>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactTitle}>John Doe</Text>
            <Text style={styles.contactInfo}>+1 (555) 123-4567</Text>
            <Text style={styles.contactEmail}>john.doe@example.com</Text>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactTitle}>Jane Smith</Text>
            <Text style={styles.contactInfo}>+1 (555) 987-6543</Text>
            <Text style={styles.contactEmail}>jane.smith@example.com</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  errorContainer: {
    backgroundColor: '#8B0000',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorSubText: {
    color: '#fff',
    marginTop: 4,
  },
  mainButtonContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emergencyButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonDescription: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  subDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 16,
  },
  infoSection: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
  infoText: {
    color: '#666',
    marginTop: 4,
  },
  contactsSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  contactTitle: {
    color: '#fff',
    fontSize: 16,
  },
  contactInfo: {
    color: '#666',
    marginTop: 4,
  },
  contactEmail: {
    color: '#666',
    marginTop: 2,
  },
}); 