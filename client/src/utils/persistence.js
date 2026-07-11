export const SessionPersistence = {
    DB_NAME: 'ExifGridDB',
    STORE_NAME: 'photos',
    VERSION: 1,

    // Initialize the IndexedDB connection
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.VERSION);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                }
            };
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Save the entire array, including the binary File objects
    async saveSession(photosArray) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            store.clear(); // Clear old session

            photosArray.forEach(p => {
                store.put({
                    id: p.id,
                    file: p.file, // IndexedDB natively supports storing File/Blob objects
                    name: p.name,
                    size: p.size,
                    naturalW: p.naturalW,
                    naturalH: p.naturalH,
                    status: p.status,
                    exif: p.exif || {},
                    isRaw: p.isRaw || false
                });
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    // Load the session and spin up fresh blob URLs
    async loadSession() {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const validPhotos = [];
                
                request.result.forEach(p => {
                    // Check if the file is a valid binary Blob/File before creating a URL
                    if (p.file && (p.file instanceof Blob || p.file instanceof File)) {
                        validPhotos.push({
                            ...p,
                            src: URL.createObjectURL(p.file)
                        });
                    } else {
                        console.warn(`Skipping invalid or corrupted file entry for ID: ${p.id}`);
                    }
                });
                
                resolve(validPhotos);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async clearSession() {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};