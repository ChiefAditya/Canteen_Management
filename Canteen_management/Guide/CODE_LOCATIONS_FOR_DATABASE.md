# 📍 Code Locations for Database Configuration

This document shows exactly where to paste your MongoDB connection string in the code.

## 🎯 Primary Location (Main Configuration)

### File: `server/.env`

**Location**: Root of server folder  
**What to paste**: Your complete MongoDB connection string

```env
# PASTE YOUR MONGODB CONNECTION STRING HERE
DATABASE_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/canteen_management?retryWrites=true&w=majority

# Example for MongoDB Atlas:
# DATABASE_URI=mongodb+srv://canteen_admin:mypassword123@canteencluster.ab1cd.mongodb.net/canteen_management?retryWrites=true&w=majority

# Example for Local MongoDB:
# DATABASE_URI=mongodb://localhost:27017/canteen_management
```

**Path from project root**: `server/.env`

---

## 🔧 Secondary Locations (Backup/Fallback)

### File: `server/config/database.hybrid.ts`

**Lines to check**: 15-25  
**What it does**: Loads DATABASE_URI from .env file  
**Action needed**: ✅ No changes needed (automatically uses .env)

```typescript
// This file automatically reads from .env
const mongoURI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/canteen-dev";
```

### File: `server/server.ts`

**Lines to check**: 15-20  
**What it does**: Initializes database connection  
**Action needed**: ✅ No changes needed (automatically uses .env)

```typescript
// This file automatically uses DATABASE_URI from .env
import { connectDB } from "./config/database.hybrid.js";
```

### File: `server/.env.example`

**Lines to check**: 1-4  
**What it does**: Template for environment variables  
**Action needed**: ✅ No changes needed (just for reference)

```env
# Database Configuration
DATABASE_URI=mongodb://127.0.0.1:27017/canteen-management
# For production, replace with actual MongoDB connection string
# DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/canteen-management
```

---

## 📝 Step-by-Step Instructions

### Step 1: Locate the .env File

1. Open your project in VS Code or any editor
2. Navigate to the `server` folder
3. Look for a file named `.env`
4. If it doesn't exist, create it

### Step 2: Open the .env File

The file should look like this:

```env
# Database Configuration
DATABASE_URI=mongodb+srv://adi:<db_password>@cluster0.58watwl.mongodb.net/Canteen_management?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=8080
NODE_ENV=development

# ... other configurations
```

### Step 3: Replace the DATABASE_URI Line

**Find this line**:

```env
DATABASE_URI=mongodb+srv://adi:<db_password>@cluster0.58watwl.mongodb.net/Canteen_management?retryWrites=true&w=majority
```

**Replace with your connection string**:

**For MongoDB Atlas:**

```env
DATABASE_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/canteen_management?retryWrites=true&w=majority
```

**For Local MongoDB:**

```env
DATABASE_URI=mongodb://localhost:27017/canteen_management
```

### Step 4: Save the File

- Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)
- Make sure the file is saved

### Step 5: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

---

## 🔍 How to Verify It's Working

### Check 1: Console Output

After starting the server, you should see:

```bash
✅ Connected to MongoDB
# or
✅ Connected to fallback in-memory MongoDB
```

### Check 2: Database Seeding

You should see:

```bash
🌱 Starting database seeding...
✅ Created canteens
✅ Created admin users
✅ Created demo users
✅ Created menu items
✅ Database seeding completed successfully!
```

### Check 3: Login Test

1. Open your application in browser
2. Try logging in with:
   - Username: `super_admin`
   - Password: `super@123`
3. If it works, your database is connected!

---

## ❌ Common Mistakes to Avoid

### Mistake 1: Wrong File Location

**❌ Wrong**: Putting .env in project root  
**✅ Correct**: Putting .env in `server/` folder

```
project/
├── client/
├── server/
│   └── .env          ← HERE
├── shared/
└── package.json
```

### Mistake 2: Including < > Brackets

**❌ Wrong**:

```env
DATABASE_URI=mongodb+srv://user:<password>@cluster.net/db
```

**✅ Correct**:

```env
DATABASE_URI=mongodb+srv://user:actualpassword@cluster.net/db
```

### Mistake 3: Missing Database Name

**❌ Wrong**:

```env
DATABASE_URI=mongodb+srv://user:pass@cluster.net/?retryWrites=true
```

**✅ Correct**:

```env
DATABASE_URI=mongodb+srv://user:pass@cluster.net/canteen_management?retryWrites=true
```

### Mistake 4: Extra Spaces

**❌ Wrong**:

```env
DATABASE_URI = mongodb+srv://user:pass@cluster.net/db
```

**✅ Correct**:

```env
DATABASE_URI=mongodb+srv://user:pass@cluster.net/db
```

---

## 🛠️ File Structure Reference

```
project/
├── client/
│   ├── pages/
│   ├── components/
│   └── lib/
├── server/
│   ├── .env                    ← PASTE CONNECTION STRING HERE
│   ├── .env.example            ← Reference only
│   ├── config/
│   │   └── database.hybrid.ts  ← Auto-reads from .env
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── utils/
│   └── server.ts               ← Auto-reads from .env
├── shared/
└── package.json
```

---

## 🚨 Security Note

**Never commit your .env file to version control!**

The `.env` file should be in your `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production

# Node modules
node_modules/

# ... other files
```

---

## 📞 Quick Help

If you're still having issues:

1. **Check file path**: Make sure `.env` is in `server/` folder
2. **Check syntax**: No spaces around `=` sign
3. **Check password**: Replace `<password>` with actual password
4. **Check database name**: Should be `canteen_management`
5. **Restart server**: Always restart after changing `.env`

**Example of a complete working .env file**:

```env
DATABASE_URI=mongodb+srv://canteen_admin:mySecretPass123@canteencluster.ab1cd.mongodb.net/canteen_management?retryWrites=true&w=majority
JWT_SECRET=my-super-secret-jwt-key-for-production
JWT_EXPIRES_IN=7d
PORT=8080
NODE_ENV=development
RAZORPAY_CANTEEN_A_KEY_ID=rzp_test_abc123
RAZORPAY_CANTEEN_A_SECRET=secret123
RAZORPAY_CANTEEN_B_KEY_ID=rzp_test_def456
RAZORPAY_CANTEEN_B_SECRET=secret456
```

**🎉 That's it! Your database connection is now configured.**
