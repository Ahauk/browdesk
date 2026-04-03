import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "browdesk_pin";
const AUTH_SESSION_KEY = "browdesk_session";

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Desbloquear BrowDesk",
    cancelLabel: "Usar codigo",
    disableDeviceFallback: true,
  });
  return result.success;
}

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const storedPin = await SecureStore.getItemAsync(PIN_KEY);
  return storedPin === pin;
}

export async function hasPin(): Promise<boolean> {
  const pin = await SecureStore.getItemAsync(PIN_KEY);
  return pin !== null;
}

export async function setSession(active: boolean): Promise<void> {
  if (active) {
    await SecureStore.setItemAsync(AUTH_SESSION_KEY, Date.now().toString());
  } else {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
  }
}

export async function isSessionValid(): Promise<boolean> {
  const session = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
  if (!session) return false;
  // Session expires after 5 minutes of inactivity
  const sessionTime = parseInt(session, 10);
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - sessionTime < fiveMinutes;
}
