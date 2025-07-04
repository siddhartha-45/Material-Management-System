#  Material and Inventory Management System

The **Material and Inventory Management System** is a web-based application designed to streamline inventory tracking, daily production logging, and vendor order management in manufacturing environments. It eliminates manual record-keeping by digitizing workflows and enables real-time access to data, ensuring efficiency, transparency, and better supply chain coordination.

---

## 🌟 Features

### 🔐 User Authentication

* Secure signup/login system with email verification
* Password hashing for enhanced security
* Role-based access control (Admin, Supervisor, Vendor)

### 📦 Inventory and Production Management

* Track raw materials, finished goods, and daily production
* View current stock levels and historical production logs
* Admin verification for incoming/outgoing stock
* Alerts for low stock thresholds

### 🗒️ Vendor Portal

* View available inventory in real-time
* Place and track material requests/orders
* Notifications on order status updates

### 📊 Real-Time Dashboards

* Production reports with date-wise tracking
* Inventory movement graphs and statistics
* Dynamic alerts and performance indicators

### 🔒 Access Control and Security

* Public access to core informational pages
* Restricted access to management features based on role
* Protected routes with session and authentication handling

---

## 🛠️ Technical Stack

### ⚙️ Backend

* **Supabase** (PostgreSQL, Auth, and Storage)

### 💻 Frontend

* **React.js** with **TypeScript**
* **Tailwind CSS** for responsive styling
* **React Router** for page routing
* **Lucide React** icons for UI components

---

## 📋 Prerequisites

Make sure you have the following installed:

* Node.js
* Git
* Supabase project configured

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/inventory-management-system.git
cd inventory-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application

```bash
npm run dev
```

Open in your browser: [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── Carousel.tsx
│   ├── Chatbot.tsx
│   ├── Counter.tsx
│   └── Navbar.tsx
├── contexts/               # Context providers (e.g., auth)
│   └── AuthContext.tsx
├── lib/                    # Supabase configuration
│   └── supabase.ts
├── pages/                  # Page components (routes)
│   ├── About.tsx
│   ├── Contact.tsx
│   ├── Home.tsx
│   ├── Inventory.tsx
│   ├── Login.tsx
│   ├── MaterialsRequest.tsx
│   ├── Production.tsx
│   ├── Signup.tsx
│   └── VendorManagement.tsx
├── App.tsx                 # Root app component
├── index.css               # Global styles
├── main.tsx                # React app entry point
├── vite-env.d.ts           # Vite environment types
├── .env                    # Environment configuration
└── supabase/migrations/    # Supabase SQL migrations
```

---

## 🔐 Security Considerations

* Passwords hashed securely by Supabase Auth
* Role-based route protection
* Session tokens managed via Supabase
* Activity logging through database triggers (optional)

---

## 📊 Data Flow

### 1. Production Entry

* Supervisor logs daily output through `Production.tsx`
* Data saved to Supabase tables
* Admin verifies and updates inventory via `Inventory.tsx`

### 2. Inventory Management

* Admins manage stock in `Inventory.tsx`
* Vendors view/request materials via `VendorManagement.tsx`

### 3. Order Processing

* Vendor submits request in `MaterialsRequest.tsx`
* Admin approves, fulfills, and updates status

---

## 🤝 Contributing

* Fork the repo
* Create a branch: `git checkout -b feature/NewFeature`
* Commit changes: `git commit -m "Add NewFeature"`
* Push to branch: `git push origin feature/NewFeature`
* Submit a Pull Request

---

## 👨‍💻 Author

**Chitikela Jishnu Venkata Siddhartha** 

GitHub: https://github.com/siddhartha-45
