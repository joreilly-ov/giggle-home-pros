import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gigglehomepros.app',
  appName: 'Giggle Home Pros',
  webDir: 'dist',
  server: {
    url: 'http://192.168.0.152:5173',
    cleartext: true
  }
};

export default config;
