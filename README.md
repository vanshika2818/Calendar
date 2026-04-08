# 📅 Interactive Wall Calendar Component

A polished, responsive, and interactive **Wall Calendar UI** built with modern React/Next.js principles. This project transforms a static calendar concept into a dynamic, user-friendly experience with date range selection, integrated notes, and a visually rich layout.

---

## ✨ Features

### 🧱 Wall Calendar Aesthetic

* Inspired by a physical wall calendar design
* Prominent **hero image section** for visual appeal
* Clean layout with strong visual hierarchy

### 📆 Date Range Selection

* Select **start and end dates**
* Clear visual states for:

  * Start date
  * End date
  * Selected range
* Handles edge cases:

  * Reverse selection
  * Reset selection

### ✍️ Notes System

* Add notes for:

  * Selected date range
  * Entire month
* **Auto-save with localStorage**
* Seamless and intuitive UX

### 📱 Fully Responsive

* **Desktop:** Split layout (image + calendar + notes)
* **Mobile:** Stacked layout optimized for touch
* Smooth transitions across screen sizes

---

## 🎨 Enhancements

* 🎬 Smooth animations and transitions
* 🌙 Dark / Light mode toggle
* 📅 Weekend highlighting
* ⚡ Micro-interactions (hover, click feedback)

---

## 🧠 Tech Stack

* **React / Next.js**
* **Tailwind CSS** (for fast and responsive styling)
* **JavaScript / TypeScript**
* **localStorage API** (for persistence)

---

## 📁 Project Structure

```
/components
  Calendar.tsx
  DateCell.tsx
  NotesPanel.tsx

/hooks
  useDateRange.ts
  useLocalStorage.ts

/utils
  dateHelpers.ts

/styles
  globals.css

/pages or /app
  index.tsx
```

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/wall-calendar.git
cd wall-calendar
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

### 4. Open in Browser

```
http://localhost:3000
```

---

## 🎥 Demo Walkthrough

In the demo video, I showcase:

1. 📅 Selecting a date range
2. ✍️ Adding and persisting notes
3. 📱 Responsive behavior (desktop → mobile)
4. 🎨 UI interactions and animations

---

## 🧩 Key Implementation Details

### Date Range Logic

* First click sets **start date**
* Second click sets **end date**
* Automatically handles reversed ranges
* Highlights range dynamically

### Notes Persistence

* Notes are stored using **localStorage**
* Auto-save on input change
* Retrieved on component mount

### Responsive Design

* Uses flexible layouts (Flex/Grid)
* Tailwind breakpoints for adaptive UI
* Mobile-first approach for usability

---

## 🚀 Future Improvements

* Drag-to-select date ranges
* Multi-month navigation with animations
* Calendar event indicators
* Backend integration for persistent storage
* Theme customization based on image

---

## 🏆 Why This Project?

This project demonstrates:

* Strong **frontend architecture**
* Attention to **UI/UX detail**
* Ability to translate **design → interactive product**
* Clean, maintainable, and scalable code practices

---

## 📬 Feedback

Feel free to share feedback or suggestions. Always open to improvements!

---
