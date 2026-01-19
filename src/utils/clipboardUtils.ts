export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!globalThis.navigator?.clipboard?.writeText) {
    return false;
  }

  await globalThis.navigator.clipboard.writeText(text);
  return true;
}
