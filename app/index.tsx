import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Switch, Platform, PermissionsAndroid, Linking, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import VoiceService from '../services/VoiceService';
import ContactService, { EmergencyContact } from '../services/ContactService';

export default function MainScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [detectedSpeech, setDetectedSpeech] = useState<string>('');
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [contacts, setContacts] = useState(ContactService.getInstance().getContacts());
  const voiceService = VoiceService.getInstance();
  const constactService = ContactService.getInstance();
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingPhoneNumber, setEditingPhoneNumber] = useState('');
  const [editingEmergencyNumber, setEditingEmergencyNumber] = useState('');
  const [showEmergencyOptions, setShowEmergencyOptions] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRelationship, setEditRelationship] = useState('');

  const requestMicrophonePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'HAVEN needs access to your microphone for voice detection.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled by the Voice module
        return true;
      }
    } catch (err) {
      console.error('Failed to request microphone permission:', err);
      return false;
    }
  };

  useEffect(() => {
    // Initialize permissions and services
    const initializeServices = async () => {
      try {
        // Request location permission
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        if (locationStatus.status !== 'granted') {
          setErrorMsg('Could not retrieve your location. Emergency features may be limited.');
        } else {
          try {
            const location = await Location.getCurrentPositionAsync({});
            setLocation(location);
          } catch (error) {
            setErrorMsg('Could not retrieve your location. Emergency features may be limited.');
          }
        }

        // Request microphone permission
        const micPermissionGranted = await requestMicrophonePermission();
        setHasMicPermission(micPermissionGranted);
        if (!micPermissionGranted) {
          Alert.alert(
            'Microphone Permission Required',
            'Voice detection requires microphone access. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Initialize voice service
        try {
          voiceService.setTriggerCallback(handleEmergencyTrigger);
          voiceService.setSpeechResultCallback((text) => {
            setDetectedSpeech(text);
          });

          // Try to start voice detection if it was previously active
          if (isListening) {
            await voiceService.startListening();
          }
        } catch (error) {
          console.error('Failed to initialize voice service:', error);
          Alert.alert(
            'Voice Service Error',
            'Failed to initialize voice detection. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error during service initialization:', error);
        Alert.alert(
          'Initialization Error',
          'Failed to initialize some services. Please try again.',
          [{ text: 'OK' }]
        );
      }
    };

    initializeServices();

    return () => {
      voiceService.destroy().catch(console.error);
    };
  }, []);

  const handleEmergencyTrigger = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      let currentLocation = null;
      try {
        currentLocation = await Location.getCurrentPositionAsync({});
      } catch (error) {
        console.error('Failed to get location during emergency:', error);
      }

      Alert.alert(
        '🚨 Emergency Alert!',
        'Voice trigger detected! Sending emergency alert...',
        [{ text: 'OK' }]
      );

      // TODO: Integrate actual emergency actions here:
      // ✅ Send SMS to emergency contacts
      // ✅ Call emergency services
      // ✅ Share location

    } catch (err) {
      Alert.alert('Error', 'Failed to process emergency trigger.');
    }
  };

  const toggleVoiceDetection = async () => {
    if (!hasMicPermission) {
      const granted = await requestMicrophonePermission();
      setHasMicPermission(granted);
      if (!granted) {
        Alert.alert('Permission Required', 'Enable microphone access in settings.');
        return;
      }
    }

    try {
      if (!isListening) {
        await voiceService.startListening();
        setIsListening(true);
        setDetectedSpeech('Listening...');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await voiceService.stopListening();
        setIsListening(false);
        setDetectedSpeech('');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error('Voice Detection Error:', error);
      setIsListening(false);
      setDetectedSpeech('Failed to start voice detection. Please try again.');
      
      // Vibrate to indicate error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Voice Detection Error',
        'Failed to start voice detection. Please try again in a few moments.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert('Calling Emergency Services', 'Connecting to 911...');
  };

  const handleQuickAlert = async () => {
    try {
      // Get all emergency contacts except emergency services
      const emergencyContacts = contacts.filter(contact => 
        contact.name !== 'Emergency Services'
      );

      if (emergencyContacts.length === 0) {
        Alert.alert('No Contacts', 'Please add emergency contacts first.');
        return;
      }

      // Get location first
      let locationMessage = '';
      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        locationMessage = `\n\n📍 Location Details:
Latitude: ${currentLocation.coords.latitude}
Longitude: ${currentLocation.coords.longitude}
Google Maps: https://maps.google.com/?q=${currentLocation.coords.latitude},${currentLocation.coords.longitude}`;
      } catch (error) {
        console.error('Error getting location:', error);
      }

      // Create initial message with location
      const initialMessage = `EMERGENCY ALERT: I need help!${locationMessage}`;

      // Format phone numbers properly (remove any non-numeric characters)
      const phoneNumbers = emergencyContacts
        .map(contact => contact.phoneNumber.replace(/\D/g, ''));

      // Try WhatsApp first
      const whatsappUrl = `whatsapp://send?phone=${phoneNumbers[0]}&text=${encodeURIComponent(initialMessage)}`;
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);

      if (canOpenWhatsApp) {
        // For WhatsApp, we need to send individual messages
        for (const phoneNumber of phoneNumbers) {
          const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(initialMessage)}`;
          await Linking.openURL(whatsappUrl);
          // Add a small delay between messages to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        // For SMS, we can send to multiple numbers at once
        const smsUrl = `sms:${phoneNumbers.join(',')}?body=${encodeURIComponent(initialMessage)}`;
        const canOpenSMS = await Linking.canOpenURL(smsUrl);
        
        if (!canOpenSMS) {
          Alert.alert('Error', 'Cannot open messaging apps');
          return;
        }
        await Linking.openURL(smsUrl);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending quick alert:', error);
      Alert.alert('Error', 'Failed to send emergency alert');
    }
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

  const handleAddContact = async () => {
    try {
      const contact = await constactService.pickFromDeviceContacts();
      if (contact) {
        const added = await constactService.addContact(contact);
        if (added) {
          setContacts(constactService.getContacts());
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Emergency contact added successfully');
        } else {
          Alert.alert(
            'Duplicate Contact',
            'This contact is already in your emergency contacts list.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert(
        'Error',
        'Failed to add contact. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await constactService.removeContact(contactId);
            setContacts(constactService.getContacts());
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleEditPhoneNumber = async (contactId: string, currentNumber: string) => {
    setEditingContactId(contactId);
    setEditingPhoneNumber(currentNumber);
  };

  const handleSavePhoneNumber = async () => {
    if (!editingContactId) return;

    try {
      const success = await constactService.updateContactPhoneNumber(editingContactId, editingPhoneNumber);
      if (success) {
        setContacts(constactService.getContacts());
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Phone number updated successfully');
      } else {
        Alert.alert('Error', 'This phone number is already in use by another contact');
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      Alert.alert('Error', 'Failed to update phone number');
    } finally {
      setEditingContactId(null);
      setEditingPhoneNumber('');
    }
  };

  const handleEditEmergencyNumber = async () => {
    try {
      await constactService.updateEmergencyServicesNumber(editingEmergencyNumber);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Emergency services number updated successfully');
    } catch (error) {
      console.error('Error updating emergency number:', error);
      Alert.alert('Error', 'Failed to update emergency services number');
    } finally {
      setEditingEmergencyNumber('');
      setShowEmergencyOptions(false);
    }
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setEditName(contact.name);
    setEditPhone(contact.phoneNumber);
    setEditRelationship(contact.relationship || '');
    setShowEditModal(true);
    setShowContactOptions(null);
  };

  const handleSaveEdit = async () => {
    if (!editingContact) return;

    try {
      const success = await constactService.updateContactPhoneNumber(editingContact.id, editPhone);
      if (success) {
        // Update other contact details
        const updatedContact = {
          ...editingContact,
          name: editName,
          phoneNumber: editPhone,
          relationship: editRelationship || undefined,
        };
        await constactService.updateContact(updatedContact);
        setContacts(constactService.getContacts());
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Error', 'This phone number is already in use by another contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      Alert.alert('Error', 'Failed to update contact');
    } finally {
      setShowEditModal(false);
      setEditingContact(null);
      setEditName('');
      setEditPhone('');
      setEditRelationship('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => router.push('/settings')}
      >
        <MaterialIcons name="settings" size={24} color="#fff" />
      </TouchableOpacity>

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

        <TouchableOpacity 
          style={[styles.infoSection, styles.voiceSection]} 
          onPress={toggleVoiceDetection}
        >
          <View style={styles.voiceHeader}>
            <MaterialIcons name="mic" size={24} color="#fff" />
            <Text style={styles.infoTitle}>Voice Detection</Text>
            <Switch
              value={isListening}
              onValueChange={toggleVoiceDetection}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isListening ? '#fff' : '#f4f3f4'}
              style={{ marginLeft: 'auto' }}
            />
          </View>
          <Text style={[styles.infoText, styles.speechText]}>
            {isListening ? (detectedSpeech || 'Listening...') : 'Voice detection is turned off'}
          </Text>
          <View style={[styles.voiceIndicator, {
            backgroundColor: isListening ? 'rgba(129, 176, 255, 0.1)' : 'transparent'
          }]}>
            <MaterialIcons 
              name={isListening ? "mic" : "mic-off"} 
              size={20} 
              color={isListening ? "#81b0ff" : "#666"} 
            />
          </View>
        </TouchableOpacity>

        <View style={styles.contactsSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="people" size={24} color="#fff" />
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity onPress={handleAddContact}>
              <MaterialIcons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.contactItem}>
            <View style={styles.contactInfoContainer}>
              <Text style={styles.contactTitle}>Emergency Services</Text>
              {editingEmergencyNumber !== '' ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.phoneInput}
                    value={editingEmergencyNumber}
                    onChangeText={setEditingEmergencyNumber}
                    keyboardType="phone-pad"
                    placeholder="Enter emergency number"
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity onPress={handleEditEmergencyNumber}>
                    <MaterialIcons name="check" size={24} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingEmergencyNumber('')}>
                    <MaterialIcons name="close" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.contactInfo}>{constactService.getEmergencyServicesNumber()}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowEmergencyOptions(!showEmergencyOptions)}
            >
              <MaterialIcons name="more-vert" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {showEmergencyOptions && (
            <View style={styles.optionsMenu}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setEditingEmergencyNumber(constactService.getEmergencyServicesNumber());
                  setShowEmergencyOptions(false);
                }}
              >
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.optionText}>Edit Number</Text>
              </TouchableOpacity>
            </View>
          )}

          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactInfoContainer}>
                <Text style={styles.contactTitle}>{contact.name}</Text>
                {editingContactId === contact.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.phoneInput}
                      value={editingPhoneNumber}
                      onChangeText={setEditingPhoneNumber}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                      placeholderTextColor="#666"
                    />
                    <TouchableOpacity onPress={handleSavePhoneNumber}>
                      <MaterialIcons name="check" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setEditingContactId(null);
                      setEditingPhoneNumber('');
                    }}>
                      <MaterialIcons name="close" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.contactInfo}>{contact.phoneNumber}</Text>
                )}
                {contact.relationship && (
                  <Text style={styles.contactEmail}>{contact.relationship}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowContactOptions(showContactOptions === contact.id ? null : contact.id)}
              >
                <MaterialIcons name="more-vert" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {showContactOptions && (
            <View style={styles.optionsMenu}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  const contact = contacts.find(c => c.id === showContactOptions);
                  if (contact) {
                    handleEditContact(contact);
                  }
                }}
              >
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.optionText}>Edit Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionItem, styles.deleteOption]}
                onPress={() => {
                  handleDeleteContact(showContactOptions);
                  setShowContactOptions(null);
                }}
              >
                <MaterialIcons name="delete" size={20} color="#FF3B30" />
                <Text style={[styles.optionText, styles.deleteOptionText]}>Delete Contact</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Voice Detection Status */}
      <View style={styles.voiceStatusContainer}>
        <Text style={styles.voiceStatusText}>
          Voice Detection: {isListening ? 'Active' : 'Inactive'}
        </Text>
        {detectedSpeech ? (
          <Text style={styles.detectedSpeechText}>
            Detected: {detectedSpeech}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[
            styles.voiceToggleButton,
            isListening ? styles.voiceToggleActive : null,
          ]}
          onPress={toggleVoiceDetection}
        >
          <MaterialIcons
            name={isListening ? 'mic' : 'mic-off'}
            size={24}
            color="#fff"
          />
          <Text style={styles.voiceToggleText}>
            {isListening ? 'Stop Detection' : 'Start Detection'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Contact</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter contact name"
                placeholderTextColor="#666"
              />

              <Text style={styles.modalLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor="#666"
              />

              <Text style={styles.modalLabel}>Relationship (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={editRelationship}
                onChangeText={setEditRelationship}
                placeholder="Enter relationship"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  contactInfoContainer: {
    flex: 1,
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
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 30,
  },
  voiceSection: {
    flexDirection: 'column',
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  speechText: {
    marginVertical: 8,
    fontStyle: 'italic',
  },
  voiceIndicator: {
    padding: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  voiceStatusContainer: {
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  voiceStatusText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  detectedSpeechText: {
    color: '#B4B4B4',
    fontSize: 14,
    marginBottom: 12,
  },
  voiceToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  voiceToggleActive: {
    backgroundColor: '#007AFF',
  },
  voiceToggleText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  menuButton: {
    padding: 8,
  },
  optionsMenu: {
    backgroundColor: '#2A2A2A',
    borderTopWidth: 1,
    borderTopColor: '#333',
    position: 'absolute',
    right: 16,
    top: 60,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    color: '#FF3B30',
  },
  optionText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 16,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneInput: {
    flex: 1,
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    paddingVertical: 4,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#404040',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
