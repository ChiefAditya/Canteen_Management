# 🗄️ MongoDB Database Configuration Guide

## IMPORTANT: How to Connect Your Real MongoDB Database

This system is currently using a hybrid database configuration with fallback to in-memory storage. To use your real MongoDB database, follow these steps:

### 📍 Configuration Files to Update

#### 1. `.env` File (MAIN CONFIGURATION)

**Location:** `/.env`
**Current Status:** Contains placeholder values

```env
# ⚠️ REPLACE THIS LINE WITH YOUR ACTUAL MONGODB CREDENTIALS ⚠️
MONGODB_URI=mongodb+srv://adi:<db_password>@cluster0.58watwl.mongodb.net/Canteen_management?retryWrites=true&w=majority&appName=Cluster0

# Replace <db_password> with your actual MongoDB Atlas password
# Example: MONGODB_URI=mongodb+srv://adi:yourActualPassword123@cluster0.58watwl.mongodb.net/Canteen_management?retryWrites=true&w=majority&appName=Cluster0
```

**For Local MongoDB (Alternative):**

```env
# If you prefer local MongoDB instead of Atlas
MONGODB_URI=mongodb://localhost:27017/Canteen_management
```

#### 2. Database Configuration

**Location:** `/server/config/database.hybrid.ts`

- This file automatically detects placeholder values and falls back to in-memory storage
- Once you update `.env` with real credentials, it will connect to your MongoDB automatically

### 🚀 Steps to Enable Real Database

1. **Update MongoDB URI:**

   - Open `.env` file
   - Replace `<db_password>` with your actual MongoDB Atlas password
   - Save the file

2. **Restart the Development Server:**

   ```bash
   # The system will automatically connect to your real database
   npm run dev
   ```

3. **Verify Connection:**
   - Check console logs for: "✅ Connected to MongoDB successfully"
   - If you see "📦 MongoDB Memory Server URI" - your credentials are still placeholder values

### 🔍 Current System Status

**Database Type:** In-Memory MongoDB (Fallback)
**Reason:** `.env` file contains `<db_password>` placeholder
**Data Persistence:** ❌ Data will be lost on server restart

**After Configuration:** MongoDB Atlas (Cloud Database)
**Data Persistence:** ✅ Data will persist permanently

### 📊 Real-Time Data Flow

Once connected to your real database:

1. **Admin adds menu items** → Saved to MongoDB
2. **User views menu** → Fetched from MongoDB (real-time)
3. **Orders placed** → Stored in MongoDB
4. **No mock data** → Only admin-added items will appear

### 🛠️ Database Schema

The system will automatically create these collections in your MongoDB:

- `canteens` - Canteen information
- `menuitems` - Menu items added by admins
- `orders` - User orders
- `users` - User accounts
- `paymentqrs` - QR code uploads

### 🔧 Alternative MongoDB Options

#### Option 1: MongoDB Atlas (Cloud) - Recommended

- Scalable and managed
- Current configuration supports this
- Update `.env` with your Atlas connection string

#### Option 2: Local MongoDB

- Install MongoDB locally
- Update `.env`: `MONGODB_URI=mongodb://localhost:27017/Canteen_management`

#### Option 3: Docker MongoDB

```bash
docker run -d -p 27017:27017 --name canteen-mongo mongo:latest
```

Then use: `MONGODB_URI=mongodb://localhost:27017/Canteen_management`

### ⚠️ Important Notes

1. **Backup:** Always backup your data before making changes
2. **Security:** Keep your MongoDB credentials secure
3. **Network:** Ensure your MongoDB server is accessible from your hosting environment
4. **Firewall:** Configure MongoDB Atlas IP whitelist if using Atlas

### 🎯 Next Steps After Database Connection

1. Login as admin and add real menu items
2. All mock data will be replaced with your admin-added items
3. Users will see only real menu items from the database
4. System will work with live, persistent data

---

**Need Help?** Check the console logs when starting the server for connection status and troubleshooting information.
