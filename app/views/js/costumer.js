document.addEventListener("DOMContentLoaded", function () {
console.log("DOM fully loaded");

// Get rate & review modal elements
const rateModal = document.getElementById("rate-review-modal");
const rateButtons = document.querySelectorAll(".rate-now-btn");
const closeRateModalBtn = document.getElementById("close-rate-modal");
const cancelRateBtn = document.getElementById("cancel-review");

console.log("Rate buttons found:", rateButtons.length);

// Get service details modal elements
const detailsModal = document.getElementById("service-details-modal");
const detailsButtons = document.querySelectorAll(".view-details-btn");
const closeDetailsModalBtn = document.getElementById(
    "close-details-modal"
);
const closeDetailsBtn = document.getElementById("close-details-btn");
const reportServiceBtn = document.getElementById("report-service-btn");

console.log("Details buttons found:", detailsButtons.length);

// Get edit profile modal elements
const editProfileModal = document.getElementById("edit-profile-modal");
const editProfileBtn = document.getElementById("edit-profile-btn");
const closeEditProfileModalBtn = document.getElementById(
    "close-edit-profile-modal"
);
const cancelEditProfileBtn = document.getElementById(
    "cancel-edit-profile"
);
const saveProfileBtn = document.getElementById("save-profile");

// Elementos relacionados con la foto podrían no existir
const changePhotoBtn = document.getElementById("change-photo-btn");
const photoUploadInput = document.getElementById("photo-upload");
const profilePreview = document.getElementById("profile-preview");
const successMessage = document.getElementById("success-message");

// Get notifications modal elements
const notificationsModal = document.getElementById(
    "notifications-modal"
);
const notificationsBtn = document.getElementById("notifications-btn");
const closeNotificationsModalBtn = document.getElementById(
    "close-notifications-modal"
);
const markAllReadBtn = document.getElementById("mark-all-read");
const viewAllNotificationsBtn = document.getElementById(
    "view-all-notifications"
);

// Rating functionality
const stars = document.querySelectorAll(".star-rating .star");
let currentRating = 0;

// Tag buttons
const tagButtons = document.querySelectorAll(".tag-button");

// Open notifications modal when notification bell is clicked
notificationsBtn.addEventListener("click", function () {
    notificationsModal.classList.remove("hidden");
});

// Close notifications modal functions
function closeNotificationsModal() {
    notificationsModal.classList.add("hidden");
}

closeNotificationsModalBtn.addEventListener(
    "click",
    closeNotificationsModal
);

// Close notifications modal when clicking outside
notificationsModal.addEventListener("click", function (e) {
    if (e.target === notificationsModal) {
    closeNotificationsModal();
    }
});

// Mark all as read functionality
markAllReadBtn.addEventListener("click", function () {
    const unreadDots = document.querySelectorAll(
    ".notification-unread-dot"
    );
    unreadDots.forEach((dot) => dot.classList.add("hidden"));

    const notificationItems =
    document.querySelectorAll(".notification-item");
    notificationItems.forEach((item) => {
    item.classList.remove("bg-slate-50");
    item.classList.add("bg-white");
    });

    // Hide counter badge on the notification bell
    document
    .querySelector("#notifications-btn span:nth-child(2)")
    .classList.add("hidden");
});

// Close edit profile modal functions
function closeEditProfileModal() {
    if (editProfileModal) {
    editProfileModal.classList.add("hidden");
    }
}

// Open edit profile modal when Edit profile button is clicked
if (editProfileBtn && editProfileModal) {
    editProfileBtn.addEventListener("click", function () {
    editProfileModal.classList.remove("hidden");
    });
}

// Close edit profile modal button listeners
if (closeEditProfileModalBtn) {
    closeEditProfileModalBtn.addEventListener(
    "click",
    closeEditProfileModal
    );
}
if (cancelEditProfileBtn) {
    cancelEditProfileBtn.addEventListener("click", closeEditProfileModal);
}

// Close edit profile modal when clicking outside
if (editProfileModal) {
    editProfileModal.addEventListener("click", function (e) {
    if (e.target === editProfileModal) {
        closeEditProfileModal();
    }
    });
}

// Change photo functionality - verificar si existen los elementos
if (changePhotoBtn && photoUploadInput) {
    changePhotoBtn.addEventListener("click", function () {
    photoUploadInput.click();
    });
}

if (photoUploadInput && profilePreview) {
    photoUploadInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
        profilePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    });
}

// Save profile changes
saveProfileBtn.addEventListener("click", function () {
    // Here you would normally send the data to the server

    // Show success message
    successMessage.classList.remove("opacity-0");
    successMessage.classList.add("opacity-100");

    // Update profile information on the page
    const fullName = document.getElementById("full-name").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;

    // Update the visible profile info
    document.querySelector("h1.text-2xl.font-bold").textContent =
    fullName;
    document.querySelector(
    "p.flex.items-center.gap-2:nth-child(2)"
    ).innerHTML =
    '<span class="material-symbols-outlined text-base text-slate-400">phone</span>' +
    phone;
    document.querySelector(
    "p.flex.items-center.gap-2:nth-child(3)"
    ).innerHTML =
    '<span class="material-symbols-outlined text-base text-slate-400">location_on</span>' +
    address;

    // Also update profile pictures if changed
    const profilePics = document.querySelectorAll(
    ".h-9.w-9.rounded-full, .h-24.w-24.rounded-full"
    );
    profilePics.forEach((pic) => {
    pic.src = profilePreview.src;
    });

    // Hide success message after 3 seconds
    setTimeout(function () {
    successMessage.classList.remove("opacity-100");
    successMessage.classList.add("opacity-0");
    }, 3000);

    // Close modal after a delay
    setTimeout(closeEditProfileModal, 1500);
});

// Función directa para abrir el modal de calificación
function openRateModal(button) {
    console.log("Opening rate modal");

    // Verificar que el modal existe
    const modal = document.getElementById("rate-review-modal");
    if (!modal) {
    console.error("Rate modal not found by ID");
    return;
    }

    modal.classList.remove("hidden");

    // Set provider name and photo based on the clicked service
    try {
    const providerName = button
        .closest("div")
        .querySelector(".font-semibold")
        .textContent.trim();
    document.getElementById("provider-name").textContent = providerName;

    // Get service date
    const serviceDate = button
        .closest("div")
        .querySelector(".text-slate-500:nth-child(3)")
        .textContent.trim();
    document.getElementById("service-date").textContent = serviceDate;
    } catch (e) {
    console.error("Error setting provider details:", e);
    }

    // Reset form if function exists
    if (typeof resetForm === "function") {
    resetForm();
    }
}

// Función directa para abrir el modal de detalles
function openDetailsModal(button) {
    console.log("Opening details modal");

    // Verificar que el modal existe
    const modal = document.getElementById("service-details-modal");
    if (!modal) {
    console.error("Details modal not found by ID");
    return;
    }

    modal.classList.remove("hidden");

    try {
    // Para Alex Ramirez, ya tenemos los datos prefijados en el modal
    // pero aún así podríamos actualizarlos dinámicamente si fuera necesario
    document.getElementById("details-provider-name").textContent =
        "Alex Ramirez";
    document.getElementById("details-service-category").textContent =
        "Plumbing";
    document.getElementById("details-service-date").textContent =
        "May 20, 2024";
    document.getElementById("details-status").textContent = "Completed";
    document.getElementById("details-rating").textContent = "(4.0)";

    // Asegurarse de que se muestre el contenedor de valoración
    document
        .getElementById("details-rating-container")
        .classList.remove("hidden");
    } catch (e) {
    console.error("Error setting details content:", e);
    }
}

// Solo agregar listeners si se encontraron botones
if (rateButtons && rateButtons.length > 0) {
    console.log(
    "Adding listeners to",
    rateButtons.length,
    "rate buttons"
    );
    // Open rate modal when Rate Now button is clicked
    rateButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("Rate button clicked");
        openRateModal(this);
    });
    });
} else {
    console.error("No rate buttons found");
}

if (detailsButtons && detailsButtons.length > 0) {
    console.log(
    "Adding listeners to",
    detailsButtons.length,
    "details buttons"
    );
    // Open details modal when View Details button is clicked
    detailsButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("Details button clicked");
        openDetailsModal(this);
    });
    });
} else {
    console.error("No details buttons found");
}

// Agregar también handlers directos para los botones usando delegación de eventos
document.body.addEventListener("click", function (e) {
    if (
    e.target.classList.contains("rate-now-btn") ||
    e.target.closest(".rate-now-btn")
    ) {
    e.preventDefault();
    openRateModal(e.target.closest(".rate-now-btn") || e.target);
    }

    if (
    e.target.classList.contains("view-details-btn") ||
    e.target.closest(".view-details-btn")
    ) {
    e.preventDefault();
    openDetailsModal(e.target.closest(".view-details-btn") || e.target);
    }
});

// Close rate modal functions
function closeRateModal() {
    if (rateModal) {
    rateModal.classList.add("hidden");
    }
}

// Add event listeners only if elements exist
if (closeRateModalBtn) {
    closeRateModalBtn.addEventListener("click", closeRateModal);
}
if (cancelRateBtn) {
    cancelRateBtn.addEventListener("click", closeRateModal);
}

// Close rate modal when clicking outside
if (rateModal) {
    rateModal.addEventListener("click", function (e) {
    if (e.target === rateModal) {
        closeRateModal();
    }
    });
}

// Close details modal functions
function closeDetailsModal() {
    if (detailsModal) {
    detailsModal.classList.add("hidden");
    }
}

// Add event listeners only if elements exist
if (closeDetailsModalBtn) {
    closeDetailsModalBtn.addEventListener("click", closeDetailsModal);
}
if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener("click", closeDetailsModal);
}

// Close details modal when clicking outside
if (detailsModal) {
    detailsModal.addEventListener("click", function (e) {
    if (e.target === detailsModal) {
        closeDetailsModal();
    }
    });
}

// Report service button
if (reportServiceBtn) {
    reportServiceBtn.addEventListener("click", function () {
    alert("Service reported. Our team will review your case shortly.");
    closeDetailsModal();
    });
} else {
    console.error("Report service button not found");
}

// Agregar handler para el botón de reporte usando delegación de eventos
document.body.addEventListener("click", function (e) {
    if (
    e.target.id === "report-service-btn" ||
    e.target.closest("#report-service-btn")
    ) {
    alert("Service reported. Our team will review your case shortly.");
    closeDetailsModal();
    }
});

// Star rating functionality
stars.forEach((star, index) => {
    star.addEventListener("click", () => {
    currentRating = index + 1;
    updateStars();
    });

    star.addEventListener("mouseover", () => {
    highlightStars(index);
    });

    star.addEventListener("mouseout", () => {
    updateStars();
    });
});

function highlightStars(index) {
    stars.forEach((star, i) => {
    star.textContent = i <= index ? "star" : "star_border";
    star.classList.toggle("text-amber-400", i <= index);
    star.classList.toggle("text-slate-300", i > index);
    });
}

function updateStars() {
    stars.forEach((star, i) => {
    star.textContent = i < currentRating ? "star" : "star_border";
    star.classList.toggle("text-amber-400", i < currentRating);
    star.classList.toggle("text-slate-300", i >= currentRating);
    });
}

// Tag buttons functionality
tagButtons.forEach((button) => {
    button.addEventListener("click", () => {
    button.classList.toggle("active");
    });
});

// Submit review
document
    .getElementById("submit-review")
    .addEventListener("click", function () {
    // Here you would normally send the data to a server

    // For demo, we'll just close the modal
    closeRateModal();

    // Optionally show a success message
    alert("Review submitted successfully!");
    });

// Reset form state
function resetForm() {
    currentRating = 0;
    updateStars();
    document.getElementById("review-comment").value = "";
    document.getElementById("recommend-provider").checked = false;
    tagButtons.forEach((button) => {
    button.classList.remove("active");
    });
}
});
