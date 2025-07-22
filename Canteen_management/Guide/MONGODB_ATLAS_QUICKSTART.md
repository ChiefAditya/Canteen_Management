# 🚀 MongoDB Atlas Quick Setup Guide

Follow these exact steps to set up MongoDB Atlas for your Canteen Management System.

## 📋 Step-by-Step Instructions

### Step 1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas**

   - Visit: https://www.mongodb.com/cloud/atlas
   - Click the green **"Try Free"** button

2. **Sign Up**

   - Enter your email address
   - Create a strong password
   - Select "I'm learning MongoDB"
   - Click **"Create your Atlas account"**

3. **Verify Email**
   - Check your email inbox
   - Click the verification link

### Step 2: Create Your First Cluster

1. **Deploy Database**

   - You'll see "Deploy your database" page
   - Choose **"M0 Sandbox"** (Free Forever)
   - Provider: **AWS** (recommended)
   - Region: Choose closest to your location (e.g., Mumbai for India)
   - Cluster Name: `CanteenCluster` (or keep default)
   - Click **"Create"**

2. **Wait for Cluster Creation**
   - This takes 3-7 minutes
   - You'll see a progress indicator

### Step 3: Create Database User

1. **Security Quickstart** will appear
2. **Create Database User**
   - Username: `canteen_admin`
   - Password: Click **"Autogenerate Secure Password"** (save this password!)
   - Or create your own strong password
   - Copy and save the password somewhere safe
   - Click **"Create User"**

### Step 4: Set Network Access

1. **Where would you like to connect from?**
   - Choose **"My Local Environment"**
   - Click **"Add My Current IP Address"**
   - Or for development, choose **"Cloud Environment"** → **"Add entries to your IP Access List"** → **"Allow access from anywhere"**
   - Click **"Finish and Close"**

### Step 5: Get Your Connection String

1. **Go to Database**

   - Click **"Database"** in the left sidebar
   - You'll see your cluster

2. **Connect**

   - Click the **"Connect"** button on your cluster
   - Choose **"Drivers"**
   - Driver: **Node.js**
   - Version: **4.1 or later**

3. **Copy Connection String**

   ```
   mongodb+srv://canteen_admin:<password>@canteencluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Modify Connection String**
   - Replace `<password>` with your actual password
   - Add the database name: `canteen_management`
   - Final string should look like:
   ```
   mongodb+srv://canteen_admin:your_actual_password@canteencluster.xxxxx.mongodb.net/canteen_management?retryWrites=true&w=majority
   ```

### Step 6: Add to Your Code

1. **Open your project**
2. **Navigate to**: `server/.env` file
3. **Find this line**:

   ```env
   DATABASE_URI=mongodb+srv://adi:<db_password>@cluster0.58watwl.mongodb.net/Canteen_management?retryWrites=true&w=majority
   ```

4. **Replace with your connection string**:

   ```env
   DATABASE_URI=mongodb+srv://canteen_admin:your_actual_password@canteencluster.xxxxx.mongodb.net/canteen_management?retryWrites=true&w=majority
   ```

5. **Save the file**

### Step 7: Test Connection

1. **Restart your server**:

   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Check console output** - you should see:

   ```
   ✅ Connected to MongoDB
   🌱 Starting database seeding...
   ✅ Created canteens
   ✅ Created admin users
   ✅ Created demo users
   ✅ Database seeding completed successfully!
   ```

3. **Test login**:
   - Open your application
   - Username: `super_admin`
   - Password: `super@123`

---

## 🎯 Real Example

Here's what your actual connection string might look like:

```env
DATABASE_URI=mongodb+srv://canteen_admin:MySecretPass123@canteencluster.ab1cd.mongodb.net/canteen_management?retryWrites=true&w=majority
```

**Breakdown**:

- `canteen_admin` = your username
- `MySecretPass123` = your password
- `canteencluster.ab1cd.mongodb.net` = your cluster URL
- `canteen_management` = database name

---

## ✅ Success Checklist

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created
- [ ] Database user `canteen_admin` created with password
- [ ] Network access configured (IP whitelisted)
- [ ] Connection string copied and modified
- [ ] Connection string pasted in `server/.env`
- [ ] Server restarted successfully
- [ ] Console shows "Connected to MongoDB"
- [ ] Database seeding completed
- [ ] Can login with `super_admin` account

---

## ❌ Common Issues & Solutions

### Issue: "Authentication failed"

**Solution**: Double-check your username and password in the connection string

### Issue: "Network timeout"

**Solution**:

1. Go to Atlas → Network Access
2. Add your current IP or "Allow access from anywhere"

### Issue: "Database not found"

**Solution**: Make sure `/canteen_management` is in your connection string

### Issue: "Invalid connection string"

**Solution**:

1. Don't include `< >` brackets
2. Replace `<password>` with actual password
3. No spaces around the `=` sign

---

## 🔧 Quick Commands

**To check if it's working**:

```bash
# In your project directory
npm run dev
```

**To restart server**:

```bash
# Press Ctrl+C to stop
# Then:
npm run dev
```

---

## 🎉 What Happens Next?

Once connected successfully:

1. **Database will be automatically created** with the name `canteen_management`
2. **7 collections will be created**:

   - users
   - canteens
   - menuitems
   - orders
   - transactions
   - feedback
   - paymentqrs

3. **Sample data will be added**:

   - 3 admin accounts
   - 2 demo user accounts
   - 2 canteens (Campus Canteen A, Guest House Canteen)
   - Sample menu items
   - Sample orders and feedback

4. **You can start using the application** immediately!

---

**🎯 Your MongoDB Atlas setup is now complete and ready to use!**
