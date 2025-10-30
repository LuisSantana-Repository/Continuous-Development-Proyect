export function validateRegister(data) {
    const { email, password, username, INE, provider, Foto, Latitude, Longitude, work } = data;

    if (!email || !password || !username || !INE || provider === undefined || !Foto || !Latitude || !Longitude) {
        //log missing fields
        console.log("Validation error: missing fields", { email, password, username, INE, provider, Foto, Latitude, Longitude });
        return "all required fields must be provided";
    }

    if (!isValidEmail(email)) {
        return "invalid email format";
    }

    if (password.length < 8) {
        return "password must be at least 8 characters";
    }

    if (provider && !work) {
        return "work data required for provider accounts";
    }

    if (provider && work) {
        const { workname, description, base_price, Service_Type, Job_Permit, Latitude: workLat, Longitude: workLng, Time_Available } = work;

        if (!workname || !description || !base_price || !Service_Type || !Job_Permit || !workLat || !workLng || !Time_Available) {
            return "all work fields required for provider accounts";
        }
    }

    return null;
}

export function validateLogin(data) {
    const { email, password } = data;

    if (!email || !password) {
        return "email and password are required";
    }

    if (!isValidEmail(email)) {
        return "invalid email format";
    }

    return null;
}

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidCoordinates(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}