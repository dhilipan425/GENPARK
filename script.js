

const googleCredential = sessionStorage.getItem("genparkGoogleCredential");

if (!googleCredential) {
  window.location.replace("login.html");
}

const RATE_DEFAULT = 40;

let hourlyRate = RATE_DEFAULT;
let selectedSlot = null;
let activeBooking = null;
let paid = false;
let occupiedSlots = new Set(["P02", "P05", "P09", "P14"]);
let toastTimer;

const $ = (id) => document.getElementById(id);

const slotGrid = $("slotGrid");
const locationInput = $("location");
const durationInput = $("duration");

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function getLocation() {
  return locationInput.value.trim() || "GENPARK Central Parking";
}

function getDuration() {
  return Number(durationInput.value) || 1;
}

function getPrice() {
  return hourlyRate * getDuration();
}

function renderSlots() {
  slotGrid.replaceChildren();

  for (let i = 1; i <= 16; i++) {
    const id = "P" + String(i).padStart(2, "0");
    const isOccupied = occupiedSlots.has(id);
    const isSelected = selectedSlot === id;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot";

    if (isOccupied) {
      button.classList.add("occupied-slot");
    } else if (isSelected) {
      button.classList.add("selected-slot");
    } else {
      button.classList.add("available-slot");
    }

    button.disabled = isOccupied || Boolean(activeBooking);

    const car = document.createElement("span");
    car.className = "car-symbol";
    car.textContent = isOccupied ? "🚗" : "🅿️";

    const label = document.createElement("span");
    label.className = "slot-name";
    label.textContent = id;

    button.append(car, label);

    if (isOccupied) {
      button.title = "Occupied";
      button.setAttribute("aria-label", id + ", occupied");
    } else {
      button.title = isSelected ? "Selected" : "Select " + id;
      button.setAttribute("aria-label", id + ", available");
      button.addEventListener("click", () => selectSlot(id));
    }

    slotGrid.appendChild(button);
  }

  $("availableCount").textContent = 16 - occupiedSlots.size;
  $("occupiedCount").textContent = occupiedSlots.size;
}

function selectSlot(id) {
  if (activeBooking) {
    showToast("Complete or exit your current booking first.");
    return;
  }

  if (occupiedSlots.has(id)) return;

  selectedSlot = id;
  $("slotMessage").textContent = id + " selected. Review your booking below.";
  updateSummary();
  renderSlots();
}

function updateSummary() {
  $("summaryLocation").textContent = getLocation();
  $("summarySlot").textContent = selectedSlot || "Not selected";
  $("summaryDuration").textContent =
    getDuration() + (getDuration() === 1 ? " hour" : " hours");
  $("summaryPrice").textContent = selectedSlot
    ? "₹" + getPrice()
    : "₹0";

  $("bookBtn").disabled = !selectedSlot || Boolean(activeBooking);

  if (!activeBooking) {
    $("payBtn").disabled = true;
    $("exitBtn").disabled = true;
  }
}

function setBookingStatus(title, message, icon = "🅿️") {
  const box = $("bookingStatus");
  box.replaceChildren();

  const iconElement = document.createElement("span");
  iconElement.className = "status-icon";
  iconElement.textContent = icon;

  const content = document.createElement("div");
  const heading = document.createElement("strong");
  const description = document.createElement("p");

  heading.textContent = title;
  description.textContent = message;

  content.append(heading, description);
  box.append(iconElement, content);
}

function reserveSlot() {
  if (!selectedSlot || activeBooking) {
    showToast("Select an available slot first.");
    return;
  }

  if (occupiedSlots.has(selectedSlot)) {
    showToast("That slot is no longer available.");
    selectedSlot = null;
    renderSlots();
    updateSummary();
    return;
  }

  const reference = "GP-" + Date.now().toString().slice(-8);

  activeBooking = {
    reference,
    slot: selectedSlot,
    location: getLocation(),
    duration: getDuration(),
    amount: getPrice(),
    status: "Reserved"
  };

  occupiedSlots.add(selectedSlot);
  paid = false;

  $("bookingReference").textContent = reference;

  setBookingStatus(
    "Booking reserved",
    selectedSlot + " · ₹" + activeBooking.amount + " · Payment pending",
    "✅"
  );

  $("payBtn").disabled = false;
  $("exitBtn").disabled = true;
  $("slotMessage").textContent =
    "Demo reservation created. Simulate payment to continue.";

  renderSlots();
  updateSummary();
  showToast("Demo booking created successfully.");
}

function simulatePayment() {
  if (!activeBooking) {
    showToast("Reserve a slot first.");
    return;
  }

  if (paid) {
    showToast("Demo payment is already marked complete.");
    return;
  }

  // This simulates a payment; no money is transferred.
  paid = true;
  activeBooking.status = "Paid (demo)";

  setBookingStatus(
    "Demo payment complete",
    "Reference " + activeBooking.reference +
      " · ₹" + activeBooking.amount + " · No money charged",
    "✅"
  );

  $("payBtn").disabled = true;
  $("exitBtn").disabled = false;

  showToast("Demo payment confirmed. No real payment was made.");
}

function verifyExit() {
  if (!activeBooking || !paid) {
    showToast("Complete the demo payment before exit verification.");
    return;
  }

  const finishedSlot = activeBooking.slot;

  occupiedSlots.delete(finishedSlot);

  setBookingStatus(
    "Exit verified (demo)",
    finishedSlot + " released. Your demo booking is complete.",
    "🚘"
  );

  $("bookingReference").textContent = activeBooking.reference;
  $("slotMessage").textContent =
    finishedSlot + " is available again.";

  activeBooking = null;
  selectedSlot = null;
  paid = false;

  $("payBtn").disabled = true;
  $("exitBtn").disabled = true;

  renderSlots();
  updateSummary();
  showToast("Demo exit verified. Slot released.");
}

function searchParking() {
  const location = getLocation();

  $("lotTitle").textContent = location;
  $("lotSubtitle").textContent =
    "Demo parking facility · Choose an available slot";

  updateSummary();
  $("parking").scrollIntoView({ behavior: "smooth" });
  showToast("Showing demo slots for " + location + ".");
}

function saveSettings() {
  const newRate = Number($("rateInput").value);

  if (!Number.isFinite(newRate) || newRate < 1 || newRate > 10000) {
    showToast("Enter an hourly rate between ₹1 and ₹10,000.");
    return;
  }

  hourlyRate = newRate;
  document.querySelector(".stat-card:last-child h2").textContent =
    "₹" + hourlyRate;

  updateSummary();
  showToast("Settings updated for this session.");
}

function addChatMessage(message, sender) {
  const bubble = document.createElement("p");
  bubble.className = "chat-bubble " + sender;
  bubble.textContent = message;
  $("chatMessages").appendChild(bubble);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
}

function assistantReply(message) {
  const text = message.toLowerCase();

  if (text.includes("price") || text.includes("cost") ||
      text.includes("fee") || text.includes("how much")) {
    return "The current demo rate is ₹" + hourlyRate +
      " per hour. Your selected duration costs ₹" + getPrice() + ".";
  }

  if (text.includes("available") || text.includes("slot")) {
    return (16 - occupiedSlots.size) +
      " demo slots are available. Green slots can be selected.";
  }

  if (text.includes("book") || text.includes("reservation")) {
    return activeBooking
      ? "Your demo booking is " + activeBooking.reference +
        " for slot " + activeBooking.slot + "."
      : "Select a green parking slot, choose your duration, and press Reserve slot.";
  }

  if (text.includes("payment") || text.includes("pay")) {
    return "The payment button only simulates payment. It does not charge money.";
  }

  if (text.includes("exit")) {
    return "For this demo, reserve a slot, simulate payment, then choose Verify exit.";
  }

  return "I can help with parking availability, prices, bookings, demo payments, and exit verification.";
}

function handleChat(event) {
  event.preventDefault();

  const input = $("chatInput");
  const message = input.value.trim();

  if (!message) return;

  addChatMessage(message, "user");
  input.value = "";

  addChatMessage(assistantReply(message), "bot");
}

function toggleSettings() {
  const panel = $("settingsPanel");
  panel.classList.toggle("hidden");

  if (!panel.classList.contains("hidden")) {
    panel.scrollIntoView({ behavior: "smooth" });
  }
}

function logout() {
  // Clear this tab's demo login state.
  sessionStorage.removeItem("genparkGoogleCredential");
  window.location.href = "login.html";
}

$("searchBtn").addEventListener("click", searchParking);
$("bookBtn").addEventListener("click", reserveSlot);
$("payBtn").addEventListener("click", simulatePayment);
$("exitBtn").addEventListener("click", verifyExit);
$("saveSettingsBtn").addEventListener("click", saveSettings);
$("settingsBtn").addEventListener("click", toggleSettings);
$("logoutBtn").addEventListener("click", logout);
$("chatForm").addEventListener("submit", handleChat);

durationInput.addEventListener("change", updateSummary);

$("themeToggle").addEventListener("change", (event) => {
  document.body.classList.toggle("light-theme", event.target.checked);
});

locationInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchParking();
});

renderSlots();
updateSummary();
