import { useEffect, useState } from 'react';

const KEY = 'atoms:profile';

export interface Profile {
  name: string;
  identity: string;
  haptics: boolean;
  sound: boolean;
  notifications: boolean;
  reminderTime: string; // "HH:MM" 24h format
  darkMode: boolean;
}

const DEFAULT: Profile = {
  name: 'friend',
  identity: 'a disciplined founder',
  haptics: true,
  sound: true,
  notifications: false,
  reminderTime: '08:00',
  darkMode: false,
};

let listeners: Array<() => void> = [];
let current: Profile = DEFAULT;

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT;
}

function save(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

current = load();

export function getProfile(): Profile {
  return current;
}

export function setProfile(p: Profile) {
  current = p;
  save(p);
  listeners.forEach((l) => l());
}

export function updateProfile(patch: Partial<Profile>) {
  setProfile({ ...current, ...patch });
}

export function useProfile(): [Profile, (p: Profile) => void] {
  const [p, setP] = useState<Profile>(current);
  useEffect(() => {
    const l = () => setP(current);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return [p, setProfile];
}
