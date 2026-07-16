import piexif from "piexifjs";

/**
 * Injects Copyright and Artist metadata into a JPEG base64 string.
 * 
 * @param {string} imageBase64 - The original image in base64 format.
 * @param {string} artistName - The creator's name.
 * @param {string} copyrightText - The copyright notice.
 * @returns {string} - The new base64 image string with injected metadata.
 */
export const injectCopyrightData = (imageBase64, artistName, copyrightText) => {
    try {
        // 1. Load existing EXIF data, or create an empty structure if missing
        let exifObj = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "Interop": {}, "thumbnail": null};
        
        try {
            exifObj = piexif.load(imageBase64);
        } catch (e) {
            console.warn("No existing EXIF found, creating new metadata block.");
        }

        // 2. Inject the new IPTC/Copyright data into the 0th IFD
        if (artistName) exifObj["0th"][piexif.ImageIFD.Artist] = artistName;
        if (copyrightText) exifObj["0th"][piexif.ImageIFD.Copyright] = copyrightText;

        // 3. Convert the EXIF object back into a binary string
        const exifBytes = piexif.dump(exifObj);

        // 4. Insert the EXIF string into the original image
        return piexif.insert(exifBytes, imageBase64);
    } catch (error) {
        console.error("Error injecting EXIF data:", error);
        return imageBase64; // Fallback to original image if injection fails
    }
};