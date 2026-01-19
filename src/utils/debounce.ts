export interface DebouncedCallback {
  call: () => void;
  cancel: () => void;
}

export function createDebouncedCallback(callback: () => void, delayMs: number): DebouncedCallback {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const call = () => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      callback();
    }, delayMs);
  };

  return { call, cancel };
}
