// MINI RESERVATION APP – Unified Booking + Admin Settings

// ===== HELPERS =====
const $ = (sel, p = document) => p.querySelector(sel);
const $$ = (sel, p = document) => Array.from(p.querySelectorAll(sel));
const todayISO = () => new Date().toISOString().split("T")[0];
const yearSpan = $("#year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// ===== GLOBAL STATE =====
let rangeSettings = JSON.parse(localStorage.getItem("rangeSettings") || "null");
let weekSettings = JSON.parse(localStorage.getItem("weekSettings") || "null");
let bookedSlots = JSON.parse(localStorage.getItem("bookedSlots") || "{}");

// If no settings found, load defaults
if (!weekSettings) {
  weekSettings = [
    { day: "Monday", startEnd: [[9, 12], [14, 17]], slotDuration: 30 },
    { day: "Tuesday", startEnd: [[10, 18]], slotDuration: 60 },
    { day: "Wednesday", startEnd: [[9, 17]], slotDuration: 30 },
    { day: "Thursday", startEnd: [[9, 12]], slotDuration: 45 },
    { day: "Friday", startEnd: [[9, 17]], slotDuration: 60 },
    { day: "Saturday", startEnd: [[10, 14]], slotDuration: 30 },
    { day: "Sunday", startEnd: [], slotDuration: 30 },
  ];
}
if (!rangeSettings) {
  rangeSettings = { type: "fixed", start: todayISO(), end: "", limit: 30 };
}

// MOBILE NAVIGATION
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = $("#menuToggle");
  const mainNav = $("#mainNav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", isOpen);
    });
    mainNav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
    window.addEventListener("click", (e) => {
      if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
});

// SETTINGS SECTION (Save / Load)
const saveBtn = $("#saveSettingsBtn");
if (saveBtn) {
  populateSettings();

  $("#fixedUseToday")?.addEventListener("change", (e) => {
    if (e.target.checked) $("#fixedStartDate").value = todayISO();
  });
  $("#limitUseToday")?.addEventListener("change", (e) => {
    if (e.target.checked) $("#limitStartDate").value = todayISO();
  });

  saveBtn.addEventListener("click", () => {
    const type = $("input[name='rangeType']:checked")?.value;
    if (!type) return alert("Please select a range type first.");

    if (type === "fixed") {
      const start = $("#fixedStartDate").value;
      const end = $("#fixedEndDate").value;
      if (!start) return alert("Please select a start date for fixed range.");
      rangeSettings = { type, start, end, limit: "" };
    } else {
      const start = $("#limitStartDate").value;
      const limitDays = parseInt($("#limitDays").value, 10) || 30;
      if (!start) return alert("Please select a start date for limited range.");
      rangeSettings = { type, start, end: "", limit: limitDays };
    }

    const newWeekSettings = [];
    $$(".day-setting").forEach((el) => {
      const day = el.dataset.day;
      const rangeStr = $("input[type=text]", el).value.trim();
      const slotDuration = parseInt($("input[type=number]", el).value.trim()) || 30;
      const startEnd = rangeStr
        ? rangeStr.split(",").map((r) => r.split("-").map(Number))
        : [];
      newWeekSettings.push({ day, startEnd, slotDuration });
    });
    weekSettings = newWeekSettings;

    localStorage.setItem("rangeSettings", JSON.stringify(rangeSettings));
    localStorage.setItem("weekSettings", JSON.stringify(weekSettings));

    renderSettingsSummary();
    alert("Settings saved successfully!");
    setTimeout(() => {
      window.location.reload();
    }, 500);
    initBooking(); // reloads booking section instantly
  });
}

function populateSettings() {
  const type = rangeSettings.type || "fixed";
  $(`input[name='rangeType'][value='${type}']`).checked = true;

  if (type === "fixed") {
    $("#fixedStartDate").value = rangeSettings.start || "";
    $("#fixedEndDate").value = rangeSettings.end || "";
  } else {
    $("#limitStartDate").value = rangeSettings.start || "";
    $("#limitDays").value = rangeSettings.limit || 30;
  }

  weekSettings.forEach((conf) => {
    const container = $(`.day-setting[data-day="${conf.day}"]`);
    if (!container) return;
    const rangeInput = $("input[type=text]", container);
    const durationInput = $("input[type=number]", container);
    rangeInput.value = conf.startEnd.map(([s, e]) => `${s}-${e}`).join(",");
    durationInput.value = conf.slotDuration;
  });
}

function renderSettingsSummary() {
  let box = $("#settingsSummary");
  if (!box) {
    box = document.createElement("div");
    box.id = "settingsSummary";
    box.className = "settings-summary";
    $(".admin-wrapper")?.appendChild(box);
  }

  const rangeInfo =
    rangeSettings.type === "fixed"
      ? `<b>Fixed Range:</b> ${rangeSettings.start || "?"} → ${
          rangeSettings.end || "No end"
        }`
      : `<b>Limited Range:</b> ${rangeSettings.start || "?"} → +${
          rangeSettings.limit || "?"
        } days`;

  const daysActive = weekSettings
    .map(
      (d) =>
        `<div><b>${d.day}</b>: ${
          d.startEnd.length
            ? d.startEnd.map(([s, e]) => `${s}:00–${e}:00`).join(", ")
            : "<em>Closed</em>"
        } (${d.slotDuration}min)</div>`
    )
    .join("");

  box.innerHTML = `
  <section class="settings-section">
    <h3 class="summary-title">Current Settings Summary</h3>
    <p>${rangeInfo}</p>
    <div class="summary-days">${daysActive}</div>
  </section>
  `;
}
renderSettingsSummary();

// BOOKING SYSTEM INITIALIZATION
const slotContainer = $("#slotContainer");
const bookNowBtn = $("#bookNowBtn");
const dateTabs = $("#dateTabs");
const customDateInput = $("#customDate");
const checkDateBtn = $("#checkDateBtn");
const form = $("#bookingForm");
const successMsg = $("#formSuccess");
const modal = $("#bookingModal");
const dialog = $(".modal-dialog", modal);
const openBtns = [$("#openModalBtn"), $("#openModalBtnHero")].filter(Boolean);
const closeBtns = $$("[data-close]", modal);

let currentOffset = 0;
let selectedDate = null;
let selectedTime = null;

// helper functions
function generateWeeklySlots(settings) {
  const result = {};
  settings.forEach(({ day, startEnd, slotDuration }) => {
    const slots = [];
    startEnd.forEach(([start, end]) => {
      let cur = start * 60;
      const endMin = end * 60;
      while (cur < endMin) {
        const h = String(Math.floor(cur / 60)).padStart(2, "0");
        const m = String(cur % 60).padStart(2, "0");
        slots.push(`${h}:${m}`);
        cur += slotDuration;
      }
    });
    result[day] = slots;
  });
  return result;
}

function initBooking() {
  const weeklySlots = generateWeeklySlots(weekSettings);
  const startDate = new Date(rangeSettings.start);
  let bookingEnd = null;
  // Set calendar input range
  if (customDateInput) {
    customDateInput.min = startDate.toISOString().split("T")[0];
    if (bookingEnd) customDateInput.max = bookingEnd.toISOString().split("T")[0];
  }
  if (rangeSettings.type === "fixed" && rangeSettings.end) {
    bookingEnd = new Date(rangeSettings.end);
  } else if (rangeSettings.type === "limit") {
    bookingEnd = new Date(startDate);
    bookingEnd.setDate(startDate.getDate() + (rangeSettings.limit || 30) - 1);
  }

  function getDayLabel(offset) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + offset);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  function getDateISO(offset) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + offset);
    return d.toISOString().split("T")[0];
  }

  function renderDateTabs() {
    dateTabs.innerHTML = `
      <button id="prevTabBtn" disabled>⬅ Prev</button>
      <button id="currentTab" class="active">${getDayLabel(0)}<br><small>${getDateISO(0)}</small></button>
      <button id="nextTabBtn">➜ Next</button>
    `;
  }
  renderDateTabs();

  function renderSlots(date) {
    const dateObj = new Date(date);
    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const allSlots = weeklySlots[weekday] || [];
    const booked = bookedSlots[date] || [];
    const bookedTimes = (bookedSlots[date] || []).map(b => b.time);
    const available = allSlots.filter((s) => !bookedTimes.includes(s));

    slotContainer.innerHTML = "";
    if (!available.length) {
      slotContainer.innerHTML = `<p>No available slots.</p>`;
      bookNowBtn.disabled = true;
      return;
    }

    available.forEach((t) => {
      const el = document.createElement("span");
      el.className = "slot";
      el.dataset.date = date;
      el.dataset.time = t;
      el.textContent = t;
      slotContainer.appendChild(el);
    });

    selectedDate = date;
    selectedTime = null;
    bookNowBtn.disabled = true;
  }
  renderSlots(getDateISO(0));

  dateTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.id === "prevTabBtn" && currentOffset > 0) currentOffset--;
    else if (btn.id === "nextTabBtn") currentOffset++;
    else if (btn.id === "currentTab") currentOffset = 0;

    renderSlots(getDateISO(currentOffset));
    updateButtons();
  });

  function updateButtons() {
  const prev = $("#prevTabBtn");
  const next = $("#nextTabBtn");
  const current = $("#currentTab");

  const cur = new Date(startDate);
  cur.setDate(startDate.getDate() + currentOffset);

  const prevDate = new Date(cur);
  prevDate.setDate(cur.getDate() - 1);

  const nextDate = new Date(cur);
  nextDate.setDate(cur.getDate() + 1);

  // Enable/disable prev and next buttons
  prev.disabled = prevDate < startDate;
  if (bookingEnd) next.disabled = nextDate > bookingEnd;
  else next.disabled = false;

  // ✅ Dynamically update middle button label & date
  const dayLabel = cur.toLocaleDateString("en-US", { weekday: "short" });
  const iso = cur.toISOString().split("T")[0];
  current.innerHTML = `${dayLabel}<br><small>${iso}</small>`;
}

  updateButtons();

  // slot click
  slotContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("slot")) return;
    $$(".slot").forEach((s) => s.classList.remove("selected"));
    e.target.classList.add("selected");
    selectedDate = e.target.dataset.date;
    selectedTime = e.target.dataset.time;
    bookNowBtn.disabled = false;
  });

  bookNowBtn.addEventListener("click", () => {
    if (!selectedDate || !selectedTime) return alert("Select a slot first.");
    openModal();
    $("#date").value = selectedDate;
    $("#time").value = selectedTime;
  });

  // custom date
  checkDateBtn?.addEventListener("click", () => {
    const date = customDateInput.value;
    if (!date) return alert("Please select a date.");

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    // Range validation
    if (selected < startDate) {
      alert(`This date is before the booking start (${startDate.toISOString().split("T")[0]}).`);
      return;
    }
    if (bookingEnd && selected > bookingEnd) {
      alert(`This date is beyond the booking end (${bookingEnd.toISOString().split("T")[0]}).`);
      return;
    }

    renderSlots(date);
  });

}
initBooking();

// MODAL + BOOKING SUBMIT
let lastFocused = null;
function openModal() {
  lastFocused = document.activeElement;
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#date").focus(), 100);
}
function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  if (lastFocused) lastFocused.focus();
  successMsg.hidden = true;
  form.reset();
  window.location.reload();
}
openBtns.forEach((b) => b.addEventListener("click", openModal));
closeBtns.forEach((b) => b.addEventListener("click", closeModal));
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.date || !data.time) return;

  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  bookings.push({ ...data, createdAt: new Date().toISOString() });
  localStorage.setItem("bookings", JSON.stringify(bookings));

  if (!bookedSlots[data.date]) bookedSlots[data.date] = [];
  bookedSlots[data.date].push({
    time: data.time,
    name: data.name,
    email: data.email,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem("bookedSlots", JSON.stringify(bookedSlots));

  const slotEl = $(`.slot[data-date="${data.date}"][data-time="${data.time}"]`);
  if (slotEl) slotEl.remove();

  successMsg.hidden = false;
  setTimeout(closeModal, 1000);
});

// RENDER BOOKED SLOTS SECTION
function renderBookedSlots() {
  const container = $("#bookedSlotsContainer");
  if (!container) return;

  const bookedData = JSON.parse(localStorage.getItem("bookedSlots") || "{}");

  // If no bookings
  if (Object.keys(bookedData).length === 0) {
    container.innerHTML = `<p>No bookings yet.</p>`;
    return;
  }

  // Build the list
  let html = "";
  Object.entries(bookedData).forEach(([date, slots]) => {
    html += `<div class="booked-day">
      <h3>${date}</h3>
      <ul>`;
    slots.forEach((s) => {
      html += `
        <li>
          <strong>${s.time}</strong> — ${s.name} (${s.email})
          <small class="muted">[${new Date(s.createdAt).toLocaleString()}]</small>
        </li>`;
    });
    html += `</ul></div>`;
  });

  container.innerHTML = html;
}

// Initial render
renderBookedSlots();

// Clear all bookings
$("#clearBookingsBtn")?.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all bookings?")) {
    localStorage.removeItem("bookedSlots");
    renderBookedSlots();
  }
});


