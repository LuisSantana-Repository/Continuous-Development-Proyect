import { getPrimaryPool } from "../config/database.js";


export async function validateRegister(data) {
    const { email, password, username, INE, provider, Foto, Latitude, Longitude, work } = data;

    if (!email || !password || !username || !INE || provider === undefined || !Foto || !Latitude || !Longitude) {
        //log missing fields
        console.log("Validation error: missing fields", { email, password, username, INE, provider, Foto, Latitude, Longitude });
        return "all required fields must be provided";
    }

    console.log("Validating email:" + email);
    if (!(await isValidEmailFormat(email))) {
        return "invalid email format";
    }
    
    console.log("Checking if email is taken:" + email);
    if (await isEmailTaken(email)) {
        return "email already registered";
    }

    console.log("Validate password length");
    if (password.length < 8) {
        return "password must be at least 8 characters";
    }

    console.log("Validate coordinates");
    if (!isValidCoordinates(Latitude, Longitude)) {
        return "invalid coordinates";
    }

    console.log("Validate provider work data");
    if (provider && !work) {
        return "work data required for provider accounts";
    }

    if (provider) {
        console.log("Validating work fields for provider");
        const { workname, description, base_price, Service_Type, Job_Permit, Latitude: workLat, Longitude: workLng, Time_Available,Images } = work;
        if (!workname || !description || !base_price || !Service_Type || !Job_Permit || !workLat || !workLng || !Time_Available ||!Images) {
            return "all work fields required for provider accounts";
        }
        work.Service_Type = await isvalidServiceType(Service_Type);
        if(!work.Service_Type){
            return "invalid service type";
        }
        if (!isValidCoordinates(workLat, workLng)) {
            return "invalid work coordinates";
        }
    }

    console.log("Register data validation passed");
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

// Check if email format is valid
export function isValidEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check if email is already taken in database
export async function isEmailTaken(email) {
    const db = await getPrimaryPool();
    const [rows] = await db.execute(
        "SELECT user_id FROM users WHERE email = ? LIMIT 1",
        [email.toLowerCase()]
    );
    return rows.length > 0; // Returns true if email exists
}

export async function isvalidServiceType(serviceType) {
    const db = await getPrimaryPool();
    const [rows] = await db.execute(
        "SELECT id FROM ServiceType WHERE type_name = ? LIMIT 1",
        [serviceType]
    );
    if(rows.length > 0){
        return rows[0];
    }else{
        return null;
    }
}

export function isValidCoordinates(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}