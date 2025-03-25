import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  relationship?: string;
}

class ContactService {
  private static instance: ContactService;
  private readonly STORAGE_KEY = '@haven_emergency_contacts';
  private readonly EMERGENCY_SERVICES_KEY = '@haven_emergency_services_number';
  private contacts: EmergencyContact[] = [];
  private emergencyServicesNumber: string = '911';

  private constructor() {
    this.loadContacts();
    this.loadEmergencyServicesNumber();
  }

  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  private async loadContacts(): Promise<void> {
    try {
      const storedContacts = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedContacts) {
        this.contacts = JSON.parse(storedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }

  private async saveContacts(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.contacts));
    } catch (error) {
      console.error('Error saving contacts:', error);
    }
  }

  private async loadEmergencyServicesNumber(): Promise<void> {
    try {
      const storedNumber = await AsyncStorage.getItem(this.EMERGENCY_SERVICES_KEY);
      if (storedNumber) {
        this.emergencyServicesNumber = storedNumber;
      }
    } catch (error) {
      console.error('Error loading emergency services number:', error);
    }
  }

  private async saveEmergencyServicesNumber(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.EMERGENCY_SERVICES_KEY, this.emergencyServicesNumber);
    } catch (error) {
      console.error('Error saving emergency services number:', error);
    }
  }

  public getEmergencyServicesNumber(): string {
    return this.emergencyServicesNumber;
  }

  public async updateEmergencyServicesNumber(newNumber: string): Promise<void> {
    this.emergencyServicesNumber = newNumber;
    await this.saveEmergencyServicesNumber();
  }

  public async updateContactPhoneNumber(contactId: string, newPhoneNumber: string): Promise<boolean> {
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) return false;

    // Check if the new number is already used by another contact
    const isDuplicate = this.contacts.some(
      c => c.id !== contactId && c.phoneNumber === newPhoneNumber
    );

    if (isDuplicate) return false;

    contact.phoneNumber = newPhoneNumber;
    await this.saveContacts();
    return true;
  }

  public async requestContactsPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  }

  public async addContact(contact: EmergencyContact): Promise<boolean> {
    // Check for duplicates by phone number
    const isDuplicate = this.contacts.some(
      existingContact => existingContact.phoneNumber === contact.phoneNumber
    );

    if (isDuplicate) {
      return false;
    }

    this.contacts.push(contact);
    await this.saveContacts();
    return true;
  }

  public async removeContact(contactId: string): Promise<void> {
    this.contacts = this.contacts.filter(contact => contact.id !== contactId);
    await this.saveContacts();
  }

  public async updateContact(updatedContact: EmergencyContact): Promise<void> {
    const index = this.contacts.findIndex(c => c.id === updatedContact.id);
    if (index !== -1) {
      this.contacts[index] = updatedContact;
      await this.saveContacts();
    }
  }

  public getContacts(): EmergencyContact[] {
    return [...this.contacts];
  }

  public async pickFromDeviceContacts(): Promise<EmergencyContact | null> {
    try {
      const hasPermission = await this.requestContactsPermission();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      // Use the native contact picker
      const result = await Contacts.presentContactPickerAsync();

      if (result && result.phoneNumbers && result.phoneNumbers.length > 0) {
        return {
          id: result.id || '',
          name: `${result.firstName || ''} ${result.lastName || ''}`.trim(),
          phoneNumber: result.phoneNumbers[0].number || '',
        };
      }
      return null;
    } catch (error) {
      console.error('Error picking contact:', error);
      return null;
    }
  }
}

export default ContactService; 