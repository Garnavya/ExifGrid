export const CompressionEngine = {
    async compressImage(file, quality = 0.8, outputType = 'image/jpeg') {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            img.onload = () => {
                // Use OffscreenCanvas for better performance off the main thread
                const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.convertToBlob({ type: outputType, quality: quality })
                    .then((blob) => {
                        URL.revokeObjectURL(objectUrl);
                        const compressedFile = new File([blob], file.name, {
                            type: outputType,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    })
                    .catch(reject);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Compression engine failed to load image.'));
            };
            
            img.src = objectUrl;
        });
    }
};