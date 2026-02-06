export const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    let dateObj;

    try {
        // Handle Firestore Timestamp Object
        if (timestamp && typeof timestamp.toDate === 'function') {
            dateObj = timestamp.toDate();
        }
        // Handle ISO String (the format you have in DB)
        else if (typeof timestamp === 'string') {
            dateObj = new Date(timestamp);
        }
        // Handle fallback seconds
        else if (timestamp.seconds !== undefined) {
            dateObj = new Date(timestamp.seconds * 1000);
        }
        else {
            dateObj = new Date(timestamp);
        }

        return isNaN(dateObj.getTime()) ? "Invalid Date" : dateObj.toLocaleString();
    } catch (e) {
        return "Date Error";
    }
};