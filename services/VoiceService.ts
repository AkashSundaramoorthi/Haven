import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

class VoiceService {
  private static instance: VoiceService;
  private isListening: boolean = false;
  private triggerPhrase: string = '';
  private onTriggerCallback: (() => void) | null = null;
  private onSpeechResultCallback: ((text: string) => void) | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;

  private constructor() {
    this.setupListeners();
  }

  private async requestMicrophonePermission(): Promise<boolean> {
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

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }

        Alert.alert(
          'Permission Required',
          'Microphone access is required for voice detection. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      return true; // iOS handles permissions automatically
    } catch (err) {
      console.error('Failed to request microphone permission:', err);
      return false;
    }
  }

  private setupListeners() {
    Voice.onSpeechResults = this.handleSpeechResults.bind(this);
    Voice.onSpeechError = this.handleSpeechError.bind(this);
    Voice.onSpeechStart = () => console.log('Speech started');
    Voice.onSpeechEnd = () => {
      console.log('Speech ended');
      if (this.isListening) {
        setTimeout(() => this.startListening().catch(console.error), 1000);
      }
    };
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  public setTriggerPhrase(phrase: string) {
    this.triggerPhrase = phrase.toLowerCase();
  }

  public setTriggerCallback(callback: () => void) {
    this.onTriggerCallback = callback;
  }

  public setSpeechResultCallback(callback: (text: string) => void) {
    this.onSpeechResultCallback = callback;
  }

  public async startListening(): Promise<void> {
    try {
      if (!this.isInitialized) {
        const hasPermission = await this.requestMicrophonePermission();
        if (!hasPermission) {
          throw new Error('Microphone permission not granted');
        }
        this.isInitialized = true;
      }

      if (!this.isListening) {
        this.isListening = true;
        await Voice.start('en-US'); // Start recognition
        console.log('Voice detection started');
      }
    } catch (error) {
      console.error('Error starting voice detection:', error);
      this.isListening = false;
    }
  }

  public async stopListening(): Promise<void> {
    try {
      if (this.isListening) {
        this.isListening = false;
        await Voice.stop();
        console.log('Voice detection stopped');
      }
    } catch (error) {
      console.error('Error stopping voice detection:', error);
    }
  }

  public async destroy(): Promise<void> {
    try {
      await this.stopListening();
      await Voice.destroy();
      this.isInitialized = false;
      console.log('Voice service destroyed successfully');
    } catch (error) {
      console.error('Error destroying voice service:', error);
    }
  }

  private handleSpeechResults(event: SpeechResultsEvent) {
    if (event.value && event.value.length > 0) {
      const spokenText = event.value[0].toLowerCase();
      console.log('Detected speech:', spokenText);

      if (this.onSpeechResultCallback) {
        this.onSpeechResultCallback(spokenText);
      }

      if (this.triggerPhrase && spokenText.includes(this.triggerPhrase)) {
        console.log('Trigger phrase detected!');
        if (this.onTriggerCallback) {
          this.onTriggerCallback();
        }
      }
    }
  }

  private handleSpeechError(event: SpeechErrorEvent) {
    console.error('Speech recognition error:', event);
    this.isListening = false;
  }

  public isVoiceListening(): boolean {
    return this.isListening;
  }
}

export default VoiceService;
