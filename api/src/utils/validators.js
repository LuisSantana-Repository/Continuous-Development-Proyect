import { getPrimaryPool } from "../config/database.js";

export async function validateRegister(data) {
  const {
    email,
    password,
    username,
    INE,
    provider,
    Foto,
    Latitude,
    Longitude,
    work,
  } = data;

  if (
    !email ||
    !password ||
    !username ||
    !INE ||
    provider === undefined ||
    !Latitude ||
    !Longitude
  ) {
    //log missing fields
    console.log("Validation error: missing fields", {
      email,
      password,
      username,
      INE,
      provider,
      Foto,
      Latitude,
      Longitude,
    });
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
    const workValidationError = await validateProviderWork(work);
    if (workValidationError) {
      return workValidationError;
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

  if (!isValidEmailFormat(email)) {
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
  if (rows.length > 0) {
    return rows[0].id; // Retornar solo el ID, no el objeto completo
  } else {
    return null;
  }
}

export function isValidCoordinates(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Valida todos los campos del trabajo del proveedor
 */
export async function validateProviderWork(work) {
  if (!work) {
    return "work data required for provider accounts";
  }

  const {
    workname,
    description,
    base_price,
    Service_Type,
    Job_Permit,
    Latitude: workLat,
    Longitude: workLng,
    Time_Available,
    Images,
  } = work;

  // Validar campos requeridos
  if (
    !workname ||
    !description ||
    !base_price ||
    !Service_Type ||
    !Job_Permit ||
    !workLat ||
    !workLng ||
    !Time_Available ||
    !Images
  ) {
    return "all work fields required for provider accounts";
  }

  // Validar workname
  if (typeof workname !== "string" || workname.trim().length < 3) {
    return "work name must be at least 3 characters";
  }
  if (workname.length > 100) {
    return "work name must be less than 100 characters";
  }

  // Validar description
  if (typeof description !== "string" || description.trim().length < 20) {
    return "description must be at least 20 characters";
  }
  if (description.length > 1000) {
    return "description must be less than 1000 characters";
  }

  // Validar base_price
  const price = Number(base_price);
  if (isNaN(price) || price <= 0) {
    return "base price must be a positive number";
  }
  if (price > 999999) {
    return "base price is too high";
  }

  // Validar Service_Type (debe existir en la BD)
  const serviceTypeResult = await isvalidServiceType(Service_Type);
  if (!serviceTypeResult) {
    return "invalid service type";
  }
  // Actualizar work con el ID del service type
  work.Service_Type = serviceTypeResult;

  // Validar Job_Permit (objeto con data y contentType)
  if (!Job_Permit.data || !Job_Permit.contentType) {
    return "job permit must include data and contentType";
  }
  if (!Job_Permit.data.startsWith("data:image/")) {
    return "job permit must be a valid base64 image";
  }
  const validImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (!validImageTypes.includes(Job_Permit.contentType)) {
    return "job permit must be jpeg, jpg, png or webp";
  }

  // Validar coordenadas del trabajo
  if (!isValidCoordinates(workLat, workLng)) {
    return "invalid work location coordinates";
  }

  // Validar Time_Available (debe ser un objeto con los 7 días de la semana)
  if (typeof Time_Available !== "object" || Time_Available === null) {
    return "time available must be an object";
  }

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Verificar que tenga las 7 propiedades
  for (const day of daysOfWeek) {
    if (!(day in Time_Available)) {
      return `time available must include ${day}`;
    }
  }

  // Validar formato de cada día
  let hasAtLeastOneDay = false;
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/; // Formato HH:MM (24 horas)

  for (const day of daysOfWeek) {
    const daySlot = Time_Available[day];

    // El día puede ser null (no disponible)
    if (daySlot === null) {
      continue;
    }

    // Si no es null, debe ser un objeto con start y end
    if (typeof daySlot !== "object") {
      return `${day} must be null or an object with start and end times`;
    }

    if (!daySlot.start || !daySlot.end) {
      return `${day} must have both start and end times`;
    }

    // Validar formato de las horas
    if (!timeRegex.test(daySlot.start)) {
      return `${day} start time must be in HH:MM format (24 hours)`;
    }

    if (!timeRegex.test(daySlot.end)) {
      return `${day} end time must be in HH:MM format (24 hours)`;
    }

    // Validar que end sea mayor que start
    const [startHour, startMin] = daySlot.start.split(":").map(Number);
    const [endHour, endMin] = daySlot.end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return `${day} end time must be after start time`;
    }

    hasAtLeastOneDay = true;
  }

  // Al menos un día debe estar disponible
  if (!hasAtLeastOneDay) {
    return "at least one day must be available";
  }

  // Validar Images (array de al menos 1 imagen, máximo 10)
  if (!Array.isArray(Images)) {
    return "images must be an array";
  }
  if (Images.length < 1) {
    return "at least one service image is required";
  }
  if (Images.length > 10) {
    return "maximum 10 service images allowed";
  }

  // Validar cada imagen del array
  for (let i = 0; i < Images.length; i++) {
    const image = Images[i];
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return `image ${i + 1} must be a valid base64 image`;
    }
  }

  return null; // Todas las validaciones pasaron
}

/**
 * Valida los datos de una solicitud de servicio
 */
export async function validateServiceRequest(data) {
  const {
    providerId,
    userId,
    description,
    preferredDate,
    address,
    contactPhone,
    amount,
  } = data;

  // Validar campos requeridos
  if (
    !providerId ||
    !userId ||
    !description ||
    !preferredDate ||
    !address ||
    !contactPhone
  ) {
    return "all required fields must be provided";
  }

  // Validar providerId (debe ser un número)
  if (isNaN(parseInt(providerId))) {
    return "provider id must be a valid number";
  }

  // Validar userId (debe ser un string UUID)
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return "user id must be provided";
  }

  // Validar description
  if (typeof description !== "string" || description.trim().length < 10) {
    return "description must be at least 10 characters";
  }
  if (description.length > 1000) {
    return "description must be less than 1000 characters";
  }

  // Validar preferredDate (debe ser una fecha válida y futura)
  const dateObj = new Date(preferredDate);
  if (isNaN(dateObj.getTime())) {
    return "preferred date must be a valid date";
  }
  // Opcional: validar que la fecha sea futura
  // const now = new Date();
  // if (dateObj < now) {
  //   return "preferred date must be in the future";
  // }

  // Validar address
  if (typeof address !== "string" || address.trim().length < 10) {
    return "address must be at least 10 characters";
  }
  if (address.length > 500) {
    return "address must be less than 500 characters";
  }

  // Validar contactPhone
  if (typeof contactPhone !== "string" || contactPhone.trim().length < 10) {
    return "contact phone must be at least 10 characters";
  }
  if (contactPhone.length > 20) {
    return "contact phone must be less than 20 characters";
  }

  // Validar amount (opcional, pero si se proporciona debe ser válido)
  if (amount !== undefined && amount !== null) {
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      return "amount must be a positive number";
    }
    if (amountNum > 9999999) {
      return "amount is too high";
    }
  }

  return null;
}

/**
 * Valida las actualizaciones de una solicitud de servicio
 */
export function validateServiceRequestUpdate(data) {
  const { status, payment_status, completed_at, amount } = data;

  // Al menos un campo debe estar presente
  if (!status && !payment_status && !completed_at && amount === undefined) {
    return "at least one field must be provided";
  }

  // Validar status si está presente
  if (status) {
    const validStatuses = [
      "pending",
      "accepted",
      "rejected",
      "in_progress",
      "completed",
    ];
    if (!validStatuses.includes(status)) {
      return "invalid status value";
    }
  }

  // Validar payment_status si está presente
  if (payment_status) {
    const validPaymentStatuses = ["pending", "paid"];
    if (!validPaymentStatuses.includes(payment_status)) {
      return "invalid payment status value";
    }
  }

  // Validar completed_at si está presente
  if (completed_at) {
    const dateObj = new Date(completed_at);
    if (isNaN(dateObj.getTime())) {
      return "completed at must be a valid date";
    }
  }

  // Validar amount si está presente
  if (amount !== undefined) {
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      return "amount must be a positive number";
    }
    if (amountNum > 9999999) {
      return "amount is too high";
    }
  }

  return null;
}

/**
 * Valida los datos de una nueva reseña
 */
export function validateReview(data) {
  const { userId, providerId, serviceRequestId, rating, comment } = data;

  // Validar campos requeridos
  if (!userId || !providerId || rating === undefined) {
    return "user id, provider id, and rating are required";
  }

  // Validar userId (debe ser un string UUID)
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return "user id must be a valid string";
  }

  // Validar providerId (debe ser un número)
  if (isNaN(parseInt(providerId))) {
    return "provider id must be a valid number";
  }

  // Validar serviceRequestId si está presente (debe ser un string UUID)
  if (
    serviceRequestId !== undefined &&
    serviceRequestId !== null &&
    (typeof serviceRequestId !== "string" ||
      serviceRequestId.trim().length === 0)
  ) {
    return "service request id must be a valid string";
  }

  // Validar rating (debe ser un número entre 1 y 5)
  const ratingNum = Number(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return "rating must be a number between 1 and 5";
  }
  // Validar que sea entero
  if (!Number.isInteger(ratingNum)) {
    return "rating must be an integer";
  }

  // Validar comment si está presente
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== "string") {
      return "comment must be a string";
    }
    if (comment.trim().length > 0 && comment.trim().length < 10) {
      return "comment must be at least 10 characters if provided";
    }
    if (comment.length > 1000) {
      return "comment must be less than 1000 characters";
    }
  }

  return null;
}

/**
 * Valida los datos de una nueva reseña de proveedor
 */
export function validateProviderReview(data) {
  const { providerId, userId, serviceRequestId, rating, comment } = data;

  // Validar campos requeridos
  if (!providerId || !userId || rating === undefined) {
    return "provider id, user id, and rating are required";
  }

  // Validar providerId (debe ser un número)
  if (isNaN(parseInt(providerId))) {
    return "provider id must be a valid number";
  }

  // Validar userId (debe ser un string UUID)
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return "user id must be a valid string";
  }

  // Validar serviceRequestId si está presente (debe ser un string UUID)
  if (
    serviceRequestId !== undefined &&
    serviceRequestId !== null &&
    (typeof serviceRequestId !== "string" ||
      serviceRequestId.trim().length === 0)
  ) {
    return "service request id must be a valid string";
  }

  // Validar rating (debe ser un número entre 1 y 5)
  const ratingNum = Number(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return "rating must be a number between 1 and 5";
  }
  // Validar que sea entero
  if (!Number.isInteger(ratingNum)) {
    return "rating must be an integer";
  }

  // Validar comment si está presente
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== "string") {
      return "comment must be a string";
    }
    if (comment.trim().length > 0 && comment.trim().length < 10) {
      return "comment must be at least 10 characters if provided";
    }
    if (comment.length > 1000) {
      return "comment must be less than 1000 characters";
    }
  }

  return null;
}

/**
 * Valida los datos de un nuevo reporte de usuario
 */
export function validateUserReport(data) {
  const { userId, serviceRequestId, reportMessage } = data;

  // Validar campos requeridos
  if (!userId || !serviceRequestId || !reportMessage) {
    return "user id, service request id, and report message are required";
  }

  // Validar userId (debe ser un string UUID)
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return "user id must be a valid string";
  }

  // Validar serviceRequestId (debe ser un string UUID)
  if (
    typeof serviceRequestId !== "string" ||
    serviceRequestId.trim().length === 0
  ) {
    return "service request id must be a valid string";
  }

  // Validar reportMessage
  if (typeof reportMessage !== "string") {
    return "report message must be a string";
  }
  if (reportMessage.trim().length < 20) {
    return "report message must be at least 20 characters";
  }
  if (reportMessage.length > 2000) {
    return "report message must be less than 2000 characters";
  }

  return null;
}

/**
 * Valida los datos de un nuevo reporte de proveedor
 */
export function validateProviderReport(data) {
  const { providerId, serviceRequestId, reportMessage } = data;

  // Validar campos requeridos
  if (!providerId || !serviceRequestId || !reportMessage) {
    return "provider id, service request id, and report message are required";
  }

  // Validar providerId (debe ser un número)
  if (isNaN(parseInt(providerId))) {
    return "provider id must be a valid number";
  }

  // Validar serviceRequestId (debe ser un string UUID)
  if (
    typeof serviceRequestId !== "string" ||
    serviceRequestId.trim().length === 0
  ) {
    return "service request id must be a valid string";
  }

  // Validar reportMessage
  if (typeof reportMessage !== "string") {
    return "report message must be a string";
  }
  if (reportMessage.trim().length < 20) {
    return "report message must be at least 20 characters";
  }
  if (reportMessage.length > 2000) {
    return "report message must be less than 2000 characters";
  }

  return null;
}

/**
 * Valida las actualizaciones de un reporte
 */
export function validateReportUpdate(data) {
  const { status } = data;

  // Al menos un campo debe estar presente
  if (!status) {
    return "status is required";
  }

  // Validar status
  const validStatuses = ["pending", "reviewing", "resolved", "rejected"];
  if (!validStatuses.includes(status)) {
    return "status must be one of: pending, reviewing, resolved, rejected";
  }

  return null;
}
