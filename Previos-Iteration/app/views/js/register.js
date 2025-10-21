function switchAccountType(type) {
const providerFields = document.getElementById("provider-fields");
const customerButton = document.getElementById("customer-button");
const providerButton = document.getElementById("provider-button");
if (type === "provider") {
    providerFields.style.display = "block";
    providerButton.classList.add(
    "bg-green-accent",
    "text-white",
    "border-green-accent"
    );
    providerButton.classList.remove(
    "bg-white",
    "text-slate-700",
    "border-slate-300"
    );
    customerButton.classList.add(
    "bg-white",
    "text-slate-700",
    "border-slate-300"
    );
    customerButton.classList.remove(
    "bg-blue-accent",
    "text-white",
    "border-blue-accent"
    );
} else {
    providerFields.style.display = "none";
    customerButton.classList.add(
    "bg-blue-accent",
    "text-white",
    "border-blue-accent"
    );
    customerButton.classList.remove(
    "bg-white",
    "text-slate-700",
    "border-slate-300"
    );
    providerButton.classList.add(
    "bg-white",
    "text-slate-700",
    "border-slate-300"
    );
    providerButton.classList.remove(
    "bg-green-accent",
    "text-white",
    "border-green-accent"
    );
}
}