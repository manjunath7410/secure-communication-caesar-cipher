import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';

/**
 * @file clipboard.ts
 * @description Native Android Capacitor & Web safe clipboard utility.
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof text !== 'string') return false;

  // 1. Try Capacitor Native Clipboard (Android native bridge)
  if (Capacitor.isPluginAvailable('Clipboard')) {
    try {
      await Clipboard.write({ string: text });
      return true;
    } catch {
      // Fall through to web clipboard API
    }
  }

  // 2. Try modern navigator.clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback if blocked by permissions policy / iframe sandbox
    }
  }

  // 3. Fallback using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export async function readFromClipboard(): Promise<string> {
  // 1. Try Capacitor Native Clipboard
  if (Capacitor.isPluginAvailable('Clipboard')) {
    try {
      const result = await Clipboard.read();
      if (result && result.value) {
        return result.value;
      }
    } catch {
      // Fall through
    }
  }

  // 2. Try modern navigator.clipboard API
  if (navigator?.clipboard?.readText) {
    try {
      return await navigator.clipboard.readText();
    } catch {
      // Fallback
    }
  }

  return '';
}

