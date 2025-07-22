# 🍽️ CSIR CRRI Canteen Management System

A comprehensive digital canteen management system built for **Council of Scientific & Industrial Research - Central Road Research Institute (CSIR CRRI)**. This system streamlines canteen operations, order management, and provides a seamless experience for both administrators and users.

![Canteen Management System](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-v18+-green) ![React](https://img.shields.io/badge/React-v18-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green) ![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Login Credentials](#login-credentials)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Admin Features](#admin-features)
- [User Features](#user-features)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)

## 🎯 Overview

The CSIR CRRI Canteen Management System is a modern, full-stack web application designed to digitize and streamline canteen operations. It provides role-based access control, real-time order management, inventory tracking, and seamless payment processing through QR codes.

### 🌟 Key Highlights

- **Dual Canteen Support**: Manage Campus Canteen A and Guest House independently
- **Role-Based Access**: Separate admin and user interfaces with canteen-specific permissions
- **Real-Time Inventory**: Live menu updates with quantity tracking and availability status
- **Organization Billing**: Support for both individual payments and organization billing workflows
- **Employee Integration**: Ready for physical signup integration with employee ID system
- **Modern UI/UX**: Government portal-style interface with responsive design

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication with secure token management
- Role-based access control (Super Admin, Canteen Admins, Users)
- Employee ID system for future physical registration integration
- Canteen-specific admin permissions
- Session management with automatic token refresh

### 👨‍💼 Admin Features

- **Dashboard Analytics**: Order statistics, revenue tracking, and performance metrics
- **Menu Management**: Add, edit, delete menu items with category organization
- **Inventory Control**: Real-time quantity tracking and availability management
- **Order Processing**: View, approve, and manage organization billing orders
- **QR Code Management**: Upload and manage payment QR codes for each canteen
- **User Management**: Register new employees and manage user accounts
- **Reports**: Comprehensive order history and financial reporting

### 👥 User Features

- **Canteen Selection**: Choose between Campus Canteen A and Guest House Canteen
- **Menu Browsing**: Filter by categories (Main Course, South Indian, Snacks, Beverages)
- **Smart Cart**: Add items with quantity selection and real-time total calculation
- **Order Types**: Select between dine-in and takeaway options
- **Payment Options**: Individual payments or organization billing
- **Order History**: Track past orders with feedback and rating system
- **Real-Time Updates**: Live menu availability and pricing

### 🛠️ System Features

- **Real-Time Data**: Live updates across all components
- **File Upload**: Cloudinary integration for QR code image management
- **Data Validation**: Comprehensive input validation and error handling
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Performance Optimized**: Fast loading with efficient data fetching

## 🚀 Technology Stack

### Frontend

- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast development server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Axios** - HTTP client for API communication
- **Lucide React** - Beautiful icon library

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Cloud-based image management

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Concurrently** - Run multiple commands
- **MongoDB Memory Server** - In-memory database for development

## 📋 Prerequisites

Before installing, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd canteen-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

The application comes with a pre-configured `.env` file for development. For production, update the following variables:

```env
# Database Configuration
MONGODB_URI=your-mongodb-connection-string
DATABASE_NAME=canteen-management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Cloudinary Configuration (for QR uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server Configuration
PORT=8080
NODE_ENV=development
```

## 🚀 Running the Application

### Development Mode (Recommended)

**Start both frontend and backend together:**

```bash
npm run dev
```

This command will:

- ✅ Start the backend server on port **8080**
- ✅ Start the frontend development server on port **3000**
- ✅ Set up an in-memory MongoDB database
- ✅ Automatically seed the database with sample data
- ✅ Configure API proxy from frontend to backend

### Alternative: Run Services Separately

**Terminal 1 - Backend Server:**

```bash
npm run dev:server
```

**Terminal 2 - Frontend Server:**

```bash
npm run dev:client
```

### Production Build

```bash
npm run build
npm start
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/api/health

## 🔑 Login Credentials

The system comes pre-seeded with test accounts for different user roles:

### 👨‍💼 Admin Accounts

| Username          | Password            | Access Level             | Description                  |
| ----------------- | ------------------- | ------------------------ | ---------------------------- |
| `super_admin`     | `super@123`         | All Canteens             | Full system administrator    |
| `canteen_a_admin` | `canteenadmin@123`  | Canteen A Only           | Campus Canteen A manager     |
| `canteen_b_admin` | `canteenbadmin@123` | Guest House Canteen Only | Guest House Canteen manager  |
| `admin`           | `admin123`          | All Canteens             | Legacy administrator account |

### 👥 User Accounts

| Username      | Password       | Role                   | Department        |
| ------------- | -------------- | ---------------------- | ----------------- |
| `user`        | `password123`  | Employee               | Research          |
| `researcher1` | `research@123` | Principal Scientist    | Materials Science |
| `engineer1`   | `engineer@123` | Technical Officer      | Civil Engineering |
| `student1`    | `student@123`  | PhD Student            | Research Scholar  |
| `staff1`      | `staff@123`    | Administrative Officer | Administration    |

## 📁 Project Structure

```
canteen-management-system/
├── client/                          # Frontend React application
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                     # Base UI components (buttons, cards, etc.)
│   │   ├── FeedbackModal.tsx       # Order feedback component
│   │   ├── LoginCredentials.tsx    # Demo credentials modal
│   │   ├── ProtectedRoute.tsx      # Route protection wrapper
│   │   └── QRUploadModal.tsx       # QR code upload component
│   ├── contexts/                   # React context providers
│   │   └── AuthContext.tsx         # Authentication state management
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries
│   │   ├── api.ts                  # API client configuration
│   │   └── utils.ts                # Helper functions
│   ├── pages/                      # Application pages/routes
│   │   ├── admin/                  # Admin dashboard and features
│   │   │   └── Dashboard.tsx       # Main admin dashboard
│   │   ├── user/                   # User interface pages
│   │   │   ├── CanteenSelection.tsx # Canteen selection page
│   │   │   ├── Menu.tsx            # Menu browsing and cart
│   │   │   ├── OrderHistory.tsx    # User order history
│   │   │   └── Payment.tsx         # Payment processing page
│   │   ├── LandingPage.tsx         # Application landing page
│   │   ├── Login.tsx               # Authentication page
│   │   └── NotFound.tsx            # 404 error page
│   └── main.tsx                    # Application entry point
├── server/                         # Backend Node.js application
│   ├── config/                     # Configuration files
│   │   ├── cloudinary.ts           # File upload configuration
│   │   ├── database.ts             # Database connection (production)
│   │   └── database.dev.ts         # Development database setup
│   ├── middleware/                 # Express middleware
│   │   └── auth.ts                 # Authentication middleware
│   ├��─ models/                     # Database models
│   │   └── index.ts                # Mongoose schemas and models
│   ├── routes/                     # API route handlers
│   │   ├── auth.ts                 # Authentication endpoints
│   │   ├── canteens.ts             # Canteen management
│   │   ├── menu.ts                 # Menu item operations
│   │   ├── orders.ts               # Order processing
│   │   └── payment.ts              # Payment QR management
│   ├── utils/                      # Utility functions
│   │   └── seed.ts                 # Database seeding script
│   ├── index.ts                    # Express server configuration
│   └── server.ts                   # Development server entry point
├── shared/                         # Shared type definitions
│   └── api.ts                      # TypeScript interfaces
├── .env                           # Environment variables
├── package.json                   # Project dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # TailwindCSS configuration
├── vite.config.ts                 # Vite frontend configuration
└── README.md                      # This file
```

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint             | Description                    | Body                                         |
| ------ | -------------------- | ------------------------------ | -------------------------------------------- |
| POST   | `/api/auth/login`    | User login                     | `{username, password, role}`                 |
| POST   | `/api/auth/register` | Register new user (Admin only) | `{username, password, role, ...userDetails}` |
| GET    | `/api/auth/profile`  | Get current user profile       | -                                            |
| POST   | `/api/auth/logout`   | User logout                    | -                                            |

### Menu Management

| Method | Endpoint                | Description                | Auth Required |
| ------ | ----------------------- | -------------------------- | ------------- |
| GET    | `/api/menu/canteen/:id` | Get menu items for canteen | No            |
| GET    | `/api/menu`             | Get all menu items         | Admin         |
| POST   | `/api/menu`             | Create new menu item       | Admin         |
| PUT    | `/api/menu/:id`         | Update menu item           | Admin         |
| DELETE | `/api/menu/:id`         | Delete menu item           | Admin         |
| PATCH  | `/api/menu/bulk-update` | Bulk update quantities     | Admin         |

### Order Management

| Method | Endpoint                        | Description         | Auth Required |
| ------ | ------------------------------- | ------------------- | ------------- |
| POST   | `/api/orders`                   | Create new order    | User          |
| GET    | `/api/orders/my-orders`         | Get user's orders   | User          |
| GET    | `/api/orders`                   | Get all orders      | Admin         |
| GET    | `/api/orders/:id`               | Get specific order  | User/Admin    |
| PATCH  | `/api/orders/:id/status`        | Update order status | Admin         |
| PATCH  | `/api/orders/:id/cancel`        | Cancel order        | User/Admin    |
| GET    | `/api/orders/analytics/summary` | Get order analytics | Admin         |

### Payment QR Management

| Method | Endpoint                   | Description        | Auth Required |
| ------ | -------------------------- | ------------------ | ------------- |
| GET    | `/api/payment/canteen/:id` | Get QR for canteen | No            |
| GET    | `/api/payment`             | Get all QRs        | Admin         |
| POST   | `/api/payment/upload`      | Upload new QR      | Admin         |
| PUT    | `/api/payment/:id`         | Update QR          | Admin         |
| DELETE | `/api/payment/:id`         | Delete QR          | Admin         |

## 🛠️ Admin Features

### Dashboard Analytics

- **Order Statistics**: Daily, weekly, and monthly order counts
- **Revenue Tracking**: Real-time revenue monitoring with trends
- **Inventory Status**: Low stock alerts and availability tracking
- **User Activity**: Active users and order patterns

### Menu Management

- **CRUD Operations**: Complete menu item lifecycle management
- **Category Organization**: Organize items by Main Course, South Indian, Snacks, Beverages
- **Inventory Tracking**: Real-time quantity updates and availability status
- **Bulk Operations**: Update multiple items simultaneously
- **Price Management**: Dynamic pricing with history tracking

### Order Processing

- **Real-Time Orders**: Live order notifications and status updates
- **Organization Billing**: Special workflow for bulk orders requiring approval
- **Status Management**: Pending → Approved → Completed workflow
- **Order Analytics**: Detailed reporting and insights

### QR Code Management

- **Upload System**: Drag-and-drop QR code image upload
- **Canteen-Specific**: Separate QR codes for each canteen
- **Cloud Storage**: Secure storage via Cloudinary integration
- **Status Control**: Activate/deactivate QR codes as needed

## 👥 User Features

### Canteen Selection

- **Dual Canteens**: Choose between Campus Canteen A and Guest House Canteen
- **Location Info**: Distance, wait times, and operating hours
- **Specialties**: View each canteen's specialty cuisines
- **Live Status**: Real-time availability and operating status

### Menu Browsing

- **Category Filters**: Filter by Main Course, South Indian, Snacks, Beverages
- **Search Functionality**: Find specific items quickly
- **Real-Time Availability**: Live stock status and pricing
- **Detailed Information**: Descriptions, ingredients, and nutritional info

### Order Management

- **Smart Cart**: Add/remove items with quantity selection
- **Order Types**: Choose between dine-in and takeaway
- **Payment Options**: Individual or organization billing
- **Order Tracking**: Real-time status updates from placement to completion

### Order History & Feedback

- **Complete History**: View all past orders with details
- **Feedback System**: Rate food quality and service
- **Recommendations**: Help improve canteen services
- **Reorder Feature**: Quickly reorder favorite meals

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Application Stuck on Loading Screen

**Problem**: Frontend shows loading spinner indefinitely
**Solution**:

```bash
# Clear browser storage
1. Open Developer Tools (F12)
2. Go to Application → Storage → Local Storage
3. Clear all entries
4. Refresh the page

# Or restart the development server
npm run dev
```

#### 2. Backend Connection Issues

**Problem**: API requests failing with connection errors
**Solution**:

```bash
# Check if both servers are running
npm run dev

# Verify backend is accessible
curl http://localhost:8080/api/health

# Check ports are not in use
lsof -i :3000
lsof -i :8080
```

#### 3. Database Connection Issues

**Problem**: MongoDB connection errors
**Solution**:
The application uses in-memory MongoDB for development, so this should rarely occur. If it does:

```bash
# Restart the development server
npm run dev:server
```

#### 4. Login Issues

**Problem**: Unable to login with provided credentials
**Solution**:

1. Ensure backend is running and seeded properly
2. Check console for API errors
3. Try clearing browser storage
4. Use exact credentials from the table above

#### 5. File Upload Issues (QR Codes)

**Problem**: QR code uploads failing
**Solution**:

1. Check Cloudinary configuration in `.env`
2. Ensure file size is under 5MB
3. Use supported formats: JPG, PNG, GIF, WebP

### Debug Mode

Enable detailed logging by checking browser console and backend logs:

```bash
# Backend logs
npm run dev:server

# Frontend - Open browser console (F12)
```

## 🔮 Future Enhancements

### Phase 1: Employee Integration

- [ ] Physical signup kiosk integration
- [ ] Employee ID card scanning
- [ ] Department-wise billing integration
- [ ] Automated employee onboarding

### Phase 2: Advanced Features

- [ ] Multi-language support (Hindi, English)
- [ ] Mobile app development (React Native)
- [ ] SMS/Email notifications
- [ ] Advanced analytics and reporting
- [ ] Inventory management with suppliers

### Phase 3: AI & Automation

- [ ] AI-powered menu recommendations
- [ ] Automated inventory management
- [ ] Predictive analytics for demand forecasting
- [ ] Chatbot for customer support

### Phase 4: Integration & Expansion

- [ ] Integration with CSIR HR systems
- [ ] Multi-campus support
- [ ] Financial system integration
- [ ] Loyalty program and rewards

## 🤝 Contributing

We welcome contributions to improve the CSIR CRRI Canteen Management System!

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features

### Reporting Issues

- Use GitHub Issues for bug reports
- Include detailed reproduction steps
- Provide screenshots if applicable
- Specify browser and version information

## 📄 License

This project is developed for CSIR CRRI and is proprietary software. All rights reserved.

## 📞 Support

For technical support or questions:

- **Email**: adityasri0202@gmail.com
- **Phone**: +91-XXX-XXX-XXX

---

<div align="center">
  <p><strong>Built with ❤️ for CSIR CRRI Community</strong></p>
  <p>© 2025 Council of Scientific & Industrial Research - Central Road Research Institute</p>
</div>
