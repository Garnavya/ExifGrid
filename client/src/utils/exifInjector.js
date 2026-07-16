import piexif from "piexifjs";

/**
 * Injects Professional Metadata into a JPEG base64 string.
 * Maps advanced fields to standard EXIF tags readable by Lightroom/Affinity.
 */
export const injectCopyrightData = (imageBase64, metadata) => {
    try {
        let exifObj = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "Interop": {}, "thumbnail": null};
        
        try {
            exifObj = piexif.load(imageBase64);
        } catch (e) {
            console.warn("No existing EXIF found, creating new metadata block.");
        }

        const { artist, copyright, title, contact, usage, jobId } = metadata;

        // 1. Basic CMI (Copyright Management Information)
        if (artist) exifObj["0th"][piexif.ImageIFD.Artist] = artist;
        if (copyright) exifObj["0th"][piexif.ImageIFD.Copyright] = copyright;

        // 2. Advanced Fields Mapping
        if (title) exifObj["0th"][piexif.ImageIFD.ImageDescription] = title;
        if (jobId) exifObj["0th"][piexif.ImageIFD.DocumentName] = jobId;
        
        // EXIF 2.3 doesn't have a native "Usage" tag, so we append Contact & Usage into the Software/HostComputer tag 
        // which Lightroom and bridge software read as extended file info.
        let extendedInfo = [];
        if (contact) extendedInfo.push(`Contact: ${contact}`);
        if (usage) extendedInfo.push(`Usage Terms: ${usage}`);
        if (extendedInfo.length > 0) {
            exifObj["0th"][piexif.ImageIFD.Software] = extendedInfo.join(" | ");
        }

        const exifBytes = piexif.dump(exifObj);
        return piexif.insert(exifBytes, imageBase64);
    } catch (error) {
        console.error("Error injecting EXIF data:", error);
        return imageBase64;
    }
};