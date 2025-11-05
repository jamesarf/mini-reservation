

A simple **reservation scheduling web app** built with pure **HTML, CSS, and JavaScript** — no backend required.  
It allows users to **book available time slots**, while admins can **configure working days, time ranges, and slot durations** using local storage.

---

## Live Demo

**[https://jamesarf.github.io/mini-reservation/](https://jamesarf.github.io/mini-reservation/)**

## Features

**User Booking**
- Choose date and available slot  
- Fill in your name and email  
- Confirm reservation instantly  
- Automatically hides already booked slots  

**Admin Settings**
- Configure booking range (Fixed or Limited days)  
- Define daily working hours and slot durations  
- Save settings to local storage  
- View booked slots list and clear all bookings  

**Smart Slot Management**
- Prevents booking in the past  
- Auto-refreshes after settings or bookings change  

**Responsive Design**
- Works seamlessly on desktop and mobile browsers  

---

## 
How It Works

1. Admin sets schedule and booking limits in the **Settings** panel.  
2. User selects a **date and time slot** from the available ones.  
3. User enters **name and email**, confirms booking.  
4. Booking is stored locally and reflected instantly on the interface.  

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla JS) |
| Data Storage | Browser Local Storage |
| Deployment | GitHub Pages |


## Project Structure
mini-reservation/

├── index.html # Main page

├── app.js # Core logic for booking & settings

├── styles.css # UI and layout styling

└── README.md # Project documentation

## How to Run Locally

1. Clone this repository:
   git clone https://github.com/jamesarf/mini-reservation.git
2. Navigate into the folder:
   cd mini-reservation
3. Open index.html in your browser — that’s it!

Notes for Admins

You can choose between:

Fixed range: Start and end date

Limited range: Start date and number of days

All data (settings and bookings) is saved locally in the browser.

After saving changes, the app reloads automatically.
