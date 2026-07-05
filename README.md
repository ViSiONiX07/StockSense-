# StockSense

StockSense is a predictive inventory management and analytics dashboard designed to solve the challenges of stockouts, inventory waste, and replenishment management for modern businesses.

## The Problem
In standard supply chain workflows, managers face a trade-off between stocking too much (leading to cash lockups and high waste write-offs) and stocking too little (leading to lost sales and poor customer satisfaction). StockSense addresses the hackathon goals of **Smart Inventory Management**, **Intelligent Procurement**, and **Operations Visibility** by using historical demand trends to forecast stock lifespans, flag perishables at risk of expiring, and automate optimal reorder target recommendations.

## Features
* **Demand Forecasting:** Predicts exactly how many days of supply are remaining for any item based on rolling usage rates.
* **Smart Restock Suggestions:** Recommends optimal reorder quantities based on target operation windows.
* **Waste-Risk Modeling:** Automatically identifies perishable items that are expiring faster than their consumption rate.
* **Operations Visibility:** Offers responsive visual breakdowns of category capital value, stock health status, and historical daily volume trends.
* **Order Fulfillment Pipeline:** Provides direct order logging, status tracking, and instant database replenishment feedback.
* **Multi-Language Support:** Instant toggle options for English and Hindi localization rules.

## Tech Stack
* **Frontend:** React (v19) with Tailwind CSS styling and Recharts visualization.
* **Backend:** Node.js & Express API servers.
* **Database:** SQLite (powered by `better-sqlite3`).
* **Utilities:** `date-fns` for date manipulation and difference calculations.

Detailed math equations, logic criteria, and implementation code snippets can be found in [TECHNICAL_BRIEF.md](TECHNICAL_BRIEF.md).

---

## Project Structure
```
StockSense/
├── backend/
│   ├── db.js             # Database table schemas
│   ├── seed.js           # Reset script with realistic category seeds
│   ├── server.js         # REST endpoints and forecasting logic
│   └── package.json
├── frontend/
│   ├── src/              # React components and styling
│   ├── package.json      # Vite configuration
│   └── tailwind.config.js
├── TECHNICAL_BRIEF.md    # Code equations and logic guidelines
└── README.md             # Setup and running instructions
```

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* npm (comes with Node.js)

### Setup & Running

1. **Install Dependencies:**
   Install backend and frontend packages.
   ```bash
   # From the project root
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Initialize and Seed the Database:**
   Generate the database tables and populate them with default items and rolling usage history.
   ```bash
   # From the backend directory
   npm run seed
   ```

3. **Start the Backend Server:**
   Launch the Express server (starts on `http://localhost:3000`).
   ```bash
   # From the backend directory
   npm start
   ```

4. **Start the Frontend Client:**
   In a separate terminal, launch the Vite development server (starts on `http://localhost:5173`).
   ```bash
   # From the frontend directory
   npm run dev
   ```

5. **Open the App:**
   Open your browser and navigate to `https://stock-sense-lake-seven.vercel.app/`.

---

## Deployment

### Backend (Render.com)
1. **Create Web Service:** Create a new Web Service on Render and connect your GitHub repository.
2. **Configure Root Directory:** Set the root directory to `backend`.
3. **Environment Variables:**
   - `PORT`: Set to `3000` (or leave blank; Render dynamic assignment is supported).
   - `FRONTEND_URL`: Set to your deployed Vercel URL (e.g. `https://stocksense.vercel.app`) to authorize CORS requests.
4. **Build and Start Commands:**
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Database Storage:**
   > [!NOTE]
   > This project uses SQLite for storage. On Render's Free tier, the file system is ephemeral, meaning the database will reset to the seeded defaults when the service restarts or redeploys. For a hackathon demo, the backend includes auto-seeding logic: if the database file is reset or empty, it will auto-populate with the mock items and daily history logs immediately upon startup.

### Frontend (Vercel.com)
1. **Create Project:** Import the repository into Vercel.
2. **Configure Directories & Settings:**
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
3. **Environment Variables:**
   - `VITE_API_URL`: Set to your deployed Render URL (e.g. `https://stocksense-backend.onrender.com`).
4. **Build and Output Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`

