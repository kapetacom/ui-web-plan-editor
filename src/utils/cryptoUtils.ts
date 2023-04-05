export const randomUUID = () => {
    try {
        return crypto.randomUUID();
    } catch (e) {
        // Fallback for browsers that don't support crypto.randomUUID() - Chromatic
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};
