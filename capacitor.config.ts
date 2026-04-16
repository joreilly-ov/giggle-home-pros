import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kisx.app',
  appName: 'KisX',
  webDir: 'dist',
  server: {
    url: 'http://192.168.0.152:5173',
    cleartext: true
  }
};

export default config;
