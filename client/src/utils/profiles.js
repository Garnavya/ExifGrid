export const ProfileManager = {
    STORAGE_KEY: 'exifgrid_custom_profiles',
    
    defaultProfiles: {
        'social_media_safe': {
            name: 'Social Media Safe',
            showCamera: false,
            showLens: false,
            showAperture: false,
            showShutter: false,
            showIso: false
        },
        'portfolio_export': {
            name: 'Portfolio Export',
            showCamera: true,
            showLens: true,
            showAperture: true,
            showShutter: true,
            showIso: true
        }
    },

    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultProfiles));
        }
    },

    getProfiles() {
        this.init();
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
    },

    saveCustomProfile(id, profileConfig) {
        const profiles = this.getProfiles();
        profiles[id] = profileConfig;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
    }
};