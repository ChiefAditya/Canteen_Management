# 🏢 MongoDB Atlas Setup - From Organization Creation

Complete step-by-step guide starting from creating an organization in MongoDB Atlas.

## 📋 Step-by-Step Process

### Step 1: Create MongoDB Atlas Account

1. **Visit MongoDB Atlas**

   - Go to: https://www.mongodb.com/cloud/atlas
   - Click **"Try Free"** button

2. **Sign Up Form**

   - Enter your **Email address**
   - Create a **Password** (minimum 8 characters)
   - Check **"I agree to the Terms of Service and Privacy Policy"**
   - Click **"Create your Atlas account"**

3. **Verify Your Email**
   - Check your email inbox
   - Look for email from MongoDB Atlas
   - Click **"Verify Email"** in the email

### Step 2: Welcome Survey (Optional)

After email verification, you'll see a welcome survey:

1. **How will you use MongoDB?**

   - Select: **"I'm learning MongoDB"**

2. **What type of application are you building?**

   - Select: **"Other"** or **"Web Application"**

3. **What's your preferred language?**

   - Select: **"JavaScript"** or **"Node.js"**

4. Click **"Finish"**

### Step 3: Create Organization

1. **Organization Setup Page**

   You'll see: _"Let's set up your organization and project"_

2. **Organization Details**

   - **Organization Name**: `CSIR CRRI Canteen Management`
   - Or use: `Canteen Management System`
   - Or your preferred organization name

3. **Cloud Service Provider** (if shown)

   - Keep default: **"MongoDB Atlas"**

4. Click **"Next"** or **"Create Organization"**

### Step 4: Create Project

1. **Project Setup**

   You'll see: _"Name your project"_

2. **Project Details**

   - **Project Name**: `Canteen Management System`
   - Or use: `CRRI Canteen Project`

3. **Add Members** (Optional)
   - You can skip this for now
   - Click **"Create Project"**

### Step 5: Deploy Your Database

1. **Database Deployment Page**

   You'll see: _"Deploy your database"_

2. **Choose Deployment Option**

   - Select: **"M0 Sandbox"**
   - This shows: **"FREE FOREVER"** tag
   - **"Shared"** option

3. **Cloud Provider & Region**

   - **Provider**: Keep **"AWS"** (recommended)
   - **Region**: Choose closest to your location:
     - For India: **"ap-south-1 (Mumbai)"**
     - For USA: **"us-east-1 (N. Virginia)"**
     - For Europe: **"eu-west-1 (Ireland)"**

4. **Cluster Tier**

   - Keep: **"M0 Sandbox (General)"**
   - Shows: "Shared RAM, 512 MB Storage"

5. **Additional Settings** (Optional)

   - **Cluster Name**: `CanteenCluster` (or keep default `Cluster0`)
   - Keep other defaults

6. Click **"Create"**

### Step 6: Security Setup

#### 6.1 Database Access (Create User)

1. **Create Database User**

   You'll see: _"How would you like to authenticate your connection?"_

2. **Authentication Method**

   - Keep: **"Username and Password"**

3. **User Credentials**

   - **Username**: `canteen_admin`
   - **Password**:
     - Option 1: Click **"Autogenerate Secure Password"** (recommended)
     - Option 2: Create your own password (minimum 8 characters)
   - **IMPORTANT**: Copy and save the password somewhere safe!

4. **Database User Privileges**

   - Keep default: **"Read and write to any database"**

5. Click **"Create User"**

#### 6.2 Network Access (IP Whitelist)

1. **Network Access Setup**

   You'll see: _"Where would you like to connect from?"_

2. **Choose Connection Type**

   **Option A - For Development (Easier)**:

   - Select: **"Cloud Environment"**
   - Then: **"Add entries to your IP Access List"**
   - Choose: **"Allow access from anywhere (includes 0.0.0.0/0)"**
   - Click **"Add Entry"**

   **Option B - For Security (Recommended)**:

   - Select: **"My Local Environment"**
   - Click: **"Add My Current IP Address"**
   - Your current IP will be automatically detected
   - Click **"Add Entry"**

3. Click **"Finish and Close"**

### Step 7: Wait for Cluster Creation

1. **Cluster Deployment**

   - You'll see: _"We're deploying your cluster..."_
   - This takes **3-7 minutes**
   - Progress bar will show completion status

2. **Completion**
   - When done, you'll see: **"Your cluster is ready!"**
   - Green checkmark will appear

### Step 8: Get Connection String

1. **Navigate to Database**

   - Click **"Database"** in the left sidebar
   - You'll see your cluster listed

2. **Connect to Cluster**

   - Click the **"Connect"** button on your cluster
   - You'll see connection options

3. **Choose Connection Method**

   - Click **"Drivers"**
   - **Driver**: Select **"Node.js"**
   - **Version**: Select **"4.1 or later"**

4. **Copy Connection String**

   You'll see a connection string like:

   ```
   mongodb+srv://canteen_admin:<password>@canteencluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. **Modify Connection String**
   - Replace `<password>` with your actual password
   - Add database name at the end:
   ```
   mongodb+srv://canteen_admin:your_actual_password@canteencluster.xxxxx.mongodb.net/canteen_management?retryWrites=true&w=majority
   ```

### Step 9: Configure in Your Application

1. **Open Your Project**

   - Navigate to your canteen management project
   - Open the `server` folder

2. **Edit .env File**

   - Open `server/.env` file
   - Find this line:

   ```env
   DATABASE_URI=mongodb+srv://adi:<db_password>@cluster0.58watwl.mongodb.net/Canteen_management?retryWrites=true&w=majority
   ```

3. **Replace with Your Connection String**

   ```env
   DATABASE_URI=mongodb+srv://canteen_admin:your_actual_password@canteencluster.xxxxx.mongodb.net/canteen_management?retryWrites=true&w=majority
   ```

4. **Save the File**

### Step 10: Test Connection

1. **Start Your Server**

   ```bash
   npm run dev
   ```

2. **Check Console Output**

   **✅ Success - You should see**:

   ```
   ✅ Connected to MongoDB
   🌱 Starting database seeding...
   ✅ Created canteens
   ✅ Created admin users
   ✅ Created demo users
   ✅ Created menu items
   ✅ Database seeding completed successfully!
   ```

3. **Test Application**
   - Open your application in browser
   - Try logging in with:
     - Username: `super_admin`
     - Password: `super@123`

---

## 📋 Example Organization Setup

### Recommended Names:

**Organization Name**:

- `CSIR CRRI Canteen Management`
- `Central Road Research Institute`
- `Government Canteen System`

**Project Name**:

- `Canteen Management System`
- `CRRI Food Services`
- `Canteen Operations`

**Cluster Name**:

- `CanteenCluster`
- `FoodServiceCluster`
- `CRRICanteenDB`

---

## 🎯 Complete Example

Here's what your final setup might look like:

```
Organization: CSIR CRRI Canteen Management
└── Project: Canteen Management System
    └── Cluster: CanteenCluster
        ├── Database: canteen_management
        ├── User: canteen_admin
        └── Collections: (auto-created)
            ├── users
            ├── canteens
            ├── menuitems
            ├── orders
            ├── transactions
            ├── feedback
            └── paymentqrs
```

**Final Connection String**:

```env
DATABASE_URI=mongodb+srv://canteen_admin:MyPassword123@canteencluster.ab1cd.mongodb.net/canteen_management?retryWrites=true&w=majority
```

---

## ⚠️ Important Notes

1. **Save Your Password**: Write down the database user password somewhere safe
2. **Cluster Takes Time**: Wait 3-7 minutes for cluster creation
3. **IP Whitelist**: Add your IP address or allow all IPs for development
4. **Database Name**: Make sure to add `/canteen_management` to connection string
5. **No Brackets**: Replace `<password>` with actual password (remove < >)

---

## 🔧 Troubleshooting

### If Organization Creation Fails:

- Check your internet connection
- Try refreshing the page
- Use a different browser
- Clear browser cache

### If Project Creation Fails:

- Make sure organization was created successfully
- Try using a shorter project name
- Refresh and try again

### If Cluster Creation Fails:

- Check if you have multiple free clusters (only 1 allowed)
- Try a different region
- Contact MongoDB support

---

**🎉 Your MongoDB Atlas is now set up and ready to use with your Canteen Management System!**
