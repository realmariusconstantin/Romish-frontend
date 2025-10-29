
# 🎨 Romish.gg Frontend

This is the **Vue 3 frontend** for the Romish.gg matchmaking system — a full CS2 10-man web platform connected to a Node.js backend and DatHost servers.

---

## 🧠 What It Does
- Handles the **UI and state** for:
  - Queue system
  - Accept/ready phase
  - Captain draft & map veto
  - Match lobby with connect info
- Displays live player data via **WebSocket updates**
- Integrates with the backend using secure Axios requests and JWT cookies
- Includes animated cards, player avatars, and ELO displays

---

## 💡 Why I Built It
The goal was to give players a **Faceit-like interface** — smooth, modern, and responsive — without relying on any existing platforms.  
This frontend also serves as the base for the **Discord-verified access system**, ensuring only authorized users can join queues or matches.

---

## 🧱 Tech Stack
- **Vue 3** (Composition API)
- **Vite** for blazing-fast builds
- **TailwindCSS** for responsive UI
- **Axios** for backend API calls
- **WebSockets** for live updates

---

## ⚙️ Setup
```bash
git clone https://github.com/realmariusconstantin/Romish-frontend.git
cd Romish-frontend
npm install
npm run dev
