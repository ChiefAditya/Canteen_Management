# 🚀 MongoDB Setup Guide - Step by Step

This guide will walk you through setting up MongoDB for the Canteen Management System.

## 📋 Table of Contents

1. [Option A: MongoDB Atlas (Cloud) - Recommended](#option-a-mongodb-atlas-cloud---recommended)
2. [Option B: Local MongoDB Installation](#option-b-local-mongodb-installation)
3. [Database Configuration in Code](#database-configuration-in-code)
4. [Creating Collections and Sample Data](#creating-collections-and-sample-data)
5. [Testing the Connection](#testing-the-connection)
6. [Troubleshooting](#troubleshooting)

---

## Option A: MongoDB Atlas (Cloud) - Recommended

### Step 1: Create MongoDB Atlas Account

1. **Visit MongoDB Atlas**

   - Go to: https://www.mongodb.com/cloud/atlas
   - Click "Try Free" button

2. **Sign Up**

   - Enter your email, password
   - Choose "I'm learning MongoDB"
   - Complete the registration

3. **Email Verification**
   - Check your email and verify your account

### Step 2: Create a New Cluster

1. **Create Organization** (if prompted)

   - Organization Name: "Canteen Management"
   - Click "Next"

2. **Create Project**

   - Project Name: "Canteen Management System"
   - Click "Next"

3. **Build Database**
   - Choose "M0 Sandbox" (Free tier)
   - Cloud Provider: AWS (recommended)
   - Region: Choose closest to your location
   - Cluster Name: "CanteenCluster"
   - Click "Create"

### Step 3: Configure Database Access

1. **Create Database User**

   - Click "Database Access" in left sidebar
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `canteen_admin`
   - Password: Generate a secure password (save this!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Configure Network Access**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for development)
   - Or enter your specific IP address
   - Click "Confirm"

### Step 4: Get Connection String

1. **Connect to Cluster**

   - Go to "Database" → "Clusters"
   - Click "Connect" button on your cluster
   - Choose "Connect your application"
   - Driver: Node.js
   - Version: 4.0 or later
   - Copy the connection string (looks like):

   ```
   mongodb+srv://canteen_admin:<password>@canteencluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

2. **Modify Connection String**
   - Replace `<password>` with your actual password
   - Add database name at the end:
   ```
   mongodb+srv://canteen_admin:your_password@canteencluster.xxxxx.mongodb.net/canteen_management?retryWrites=true&w=majority
   ```

---

## Option B: Local MongoDB Installation

### Step 1: Install MongoDB Community Edition

#### For Windows:

1. **Download MongoDB**

   - Visit: https://www.mongodb.com/try/download/community
   - Select Windows, Version 7.0+
   - Download the MSI installer

2. **Install MongoDB**

   - Run the downloaded .msi file
   - Choose "Complete" installation
   - Install MongoDB as a Service: ✅ Yes
   - Install MongoDB Compass: ✅ Yes

3. **Start MongoDB Service**
   - Open Services (Windows + R → `services.msc`)
   - Find "MongoDB" service
   - Right-click → Start

#### For macOS:

```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

#### For Linux (Ubuntu):

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 2: Local Connection String

For local MongoDB, your connection string will be:

```
mongodb://localhost:27017/canteen_management
```

---

## Database Configuration in Code

### Step 1: Update Environment File

**File Location**: `server/.env`

1. **Open the file**: `server/.env`
2. **Find this line**:

   ```env
   DATABASE_URI=mongodb+srv://adi:<db_password>@cluster0.58watwl.mongodb.net/Canteen_management?retryWrites=true&w=majority
   ```

3. **Replace with your connection string**:

   **For MongoDB Atlas (Cloud):**

   ```env
   DATABASE_URI=mongodb+srv://canteen_admin:your_password@canteencluster.xxxxx.mongodb.net/canteen_management?retryWrites=true&w=majority
   ```

   **For Local MongoDB:**

   ```env
   DATABASE_URI=mongodb://localhost:27017/canteen_management
   ```

### Step 2: Verify Configuration Files

**File**: `server/config/database.hybrid.ts`

This file should automatically use your `DATABASE_URI` from `.env`. No changes needed.

**File**: `server/server.ts`

This file loads the database connection. No changes needed.

### Step 3: Example .env File

Create or update your `server/.env` file:

```env
# MongoDB Database Connection
DATABASE_URI=mongodb+srv://canteen_admin:your_password@canteencluster.xxxxx.mongodb.net/canteen_management?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=8080
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay - Campus Canteen A
RAZORPAY_CANTEEN_A_KEY_ID=rzp_test_campus_key
RAZORPAY_CANTEEN_A_SECRET=campus_secret

# Razorpay - Guest House Canteen
RAZORPAY_CANTEEN_B_KEY_ID=rzp_test_guest_key
RAZORPAY_CANTEEN_B_SECRET=guest_secret

# Razorpay - Default
RAZORPAY_KEY_ID=rzp_test_default
RAZORPAY_KEY_SECRET=default_secret
```

---

## Creating Collections and Sample Data

### Option 1: Automatic Creation (Recommended)

The application will automatically create collections and sample data when you start the server.

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Check the console output** - you should see:
   ```
   ✅ Connected to MongoDB
   🌱 Starting database seeding...
   ✅ Created canteens
   ✅ Created admin users
   ✅ Created demo users
   ✅ Created menu items
   ✅ Database seeding completed successfully!
   ```

### Option 2: Manual Creation (Using MongoDB Compass)

1. **Open MongoDB Compass**

   - Connect using your connection string
   - Create new database: `canteen_management`

2. **Create Collections**:

   - `users`
   - `canteens`
   - `menuitems`
   - `orders`
   - `transactions`
   - `feedback`
   - `paymentqrs`

3. **Import Sample Data** (optional)
   - Use the sample data from `DATABASE_STRUCTURE.md`

### Option 3: Using MongoDB Shell

```javascript
// Connect to MongoDB
use canteen_management

// Create sample user
db.users.insertOne({
  username: "super_admin",
  password: "$2a$12$hashedPassword",
  role: "admin",
  fullName: "Super Administrator",
  assignedCanteens: [],
  permissions: ["manage_all"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Create sample canteen
db.canteens.insertOne({
  id: "canteen-a",
  name: "Campus Canteen A",
  location: "Main Campus Building",
  timing: "8:00 AM - 5:00 PM",
  isActive: true,
  specialties: ["North Indian", "South Indian", "Snacks"],
  rating: 4.5,
  distance: "200m",
  waitTime: "5-10 mins",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Testing the Connection

### Step 1: Start the Server

```bash
# In your project directory
npm run dev
```

### Step 2: Check Console Output

**✅ Success - You should see**:

```
✅ Connected to MongoDB
📡 API available at http://localhost:8080/api
🌱 Starting database seeding...
✅ Database seeding completed successfully!
```

**❌ Error - You might see**:

```
❌ Failed to connect to MongoDB
Error: authentication failed
```

### Step 3: Test Database Connection

**Option A: Check Health Endpoint**

```bash
curl http://localhost:8080/api/health
```

**Option B: Use MongoDB Compass**

- Connect using your connection string
- Browse the `canteen_management` database
- Check if collections were created

**Option C: Check Application**

- Open your application in browser
- Try logging in with: `super_admin` / `super@123`
- If login works, database is connected!

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Authentication Failed"

**Problem**: Wrong username/password in connection string

**Solution**:

1. Check MongoDB Atlas → Database Access
2. Verify username and password
3. Update connection string in `.env`

#### Issue 2: "Network Access Denied"

**Problem**: IP address not whitelisted

**Solution**:

1. Go to MongoDB Atlas → Network Access
2. Add your IP address or "Allow access from anywhere"

#### Issue 3: "Database Not Found"

**Problem**: Database name missing from connection string

**Solution**:

1. Add `/canteen_management` before the `?` in your connection string:
   ```
   mongodb+srv://user:pass@cluster.net/canteen_management?retryWrites=true
   ```

#### Issue 4: "Connection Timeout"

**Problem**: Network issues or wrong cluster URL

**Solution**:

1. Check your internet connection
2. Verify cluster URL in MongoDB Atlas
3. Try pinging the cluster

#### Issue 5: "SSL/TLS Error"

**Problem**: SSL certificate issues

**Solution**:

1. Add `&tlsAllowInvalidCertificates=true` to connection string (dev only)
2. Or update your Node.js version

### Debug Steps

1. **Check .env file location**:

   ```bash
   ls -la server/.env
   ```

2. **Verify environment variables**:

   ```javascript
   console.log("DATABASE_URI:", process.env.DATABASE_URI);
   ```

3. **Test basic MongoDB connection**:
   ```javascript
   const mongoose = require("mongoose");
   mongoose
     .connect(process.env.DATABASE_URI)
     .then(() => console.log("✅ Connected"))
     .catch((err) => console.error("❌ Error:", err));
   ```

---

## 🎯 Quick Setup Checklist

- [ ] MongoDB Atlas account created (or local MongoDB installed)
- [ ] Database cluster created and configured
- [ ] Database user created with proper permissions
- [ ] Network access configured (IP whitelisted)
- [ ] Connection string copied and modified
- [ ] `server/.env` file updated with `DATABASE_URI`
- [ ] Development server started (`npm run dev`)
- [ ] Console shows successful database connection
- [ ] Collections created (automatically or manually)
- [ ] Application login works (test with `super_admin`)

---

## 🆘 Need Help?

### MongoDB Atlas Support

- Documentation: https://docs.atlas.mongodb.com/
- Support: https://support.mongodb.com/

### Application Issues

- Check console logs for specific error messages
- Verify all environment variables are set
- Ensure database user has correct permissions

---

**🎉 Once everything is set up, your canteen management system will have a fully functional MongoDB database with real-time data!**
