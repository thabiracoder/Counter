const DATABASE_NAME = 'digital-tasbeeh';
const DATABASE_VERSION = 1;
const STORE_NAME = 'counter';
const COUNTER_KEY = 'total';

interface CounterRecord {
  key: string;
  value: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local counter storage.'));
      return;
    }

    const request = window.indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Unable to open local counter storage.'));
  });
}

export async function loadCount(): Promise<bigint> {
  const database = await openDatabase();

  try {
    const record = await new Promise<CounterRecord | undefined>(
      (resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(COUNTER_KEY);
        request.onsuccess = () => resolve(request.result as CounterRecord | undefined);
        request.onerror = () =>
          reject(request.error ?? new Error('Unable to read the saved count.'));
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Unable to read the saved count.'));
      },
    );

    if (!record) return 0n;
    if (!/^\d+$/.test(record.value)) {
      throw new Error('The saved count is not valid.');
    }
    return BigInt(record.value);
  } finally {
    database.close();
  }
}

export async function saveCount(count: bigint): Promise<void> {
  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({
        key: COUNTER_KEY,
        value: count.toString(),
      } satisfies CounterRecord);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Unable to save the count.'));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('Unable to save the count.'));
    });
  } finally {
    database.close();
  }
}