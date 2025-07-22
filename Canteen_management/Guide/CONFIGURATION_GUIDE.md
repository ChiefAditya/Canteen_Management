# 🔧 Configuration Guide - Canteen Management System

This guide explains where and how to configure MongoDB database connections and Razorpay payment credentials for the Canteen Management System.

## 📋 Table of Contents

- [MongoDB Database Configuration](#mongodb-database-configuration)
- [Razorpay Payment Configuration](#razorpay-payment-configuration)
- [Per-Canteen Razorpay Setup](#per-canteen-razorpay-setup)
- [Environment Variables](#environment-variables)
- [Quick Setup Checklist](#quick-setup-checklist)

---

## 🗄️ MongoDB Database Configuration

### Primary Configuration Location

**File:** `server/.env`

```env
# MongoDB Database Connection
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

### Backup Locations to Update

#### 1. Database Connection Handler

**File:** `server/config/database.hybrid.ts`
**Lines:** 23-30

```typescript
// Check if the URI has placeholder values
if (
  mongoURI.includes("<db_password>") ||
  mongoURI.includes("username:password") ||
  mongoURI.includes("placeholder")
) {
  console.warn("⚠️ Database URI contains placeholder values...");
}
```

#### 2. Server Startup

**File:** `server/server.ts`
**Lines:** 15-20

```typescript
// Database connection initialization
const mongoURI =
  process.env.DATABASE_URI || "mongodb://localhost:27017/canteen-dev";
```

#### 3. Environment Example

**File:** `server/.env.example`
**Lines:** 1-4

```env
# Database Configuration
DATABASE_URI=mongodb://127.0.0.1:27017/canteen-management
# For production, replace with actual MongoDB connection string
# DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/canteen-management
```

### MongoDB Setup Steps

1. **Create MongoDB Atlas Account** (or use local MongoDB)
2. **Create Database Cluster**
3. **Get Connection String** from Atlas Dashboard
4. **Replace placeholders** in connection string:
   - `<username>` → Your database username
   - `<password>` → Your database password
   - `<cluster-url>` → Your cluster URL
5. **Update `.env` file** with the connection string

---

## 💳 Razorpay Payment Configuration

### Environment Variables Setup

**File:** `server/.env`

```env
# Razorpay Configuration for Campus Canteen A
RAZORPAY_CANTEEN_A_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_CANTEEN_A_SECRET=your_razorpay_secret_here

# Razorpay Configuration for Guest House Canteen
RAZORPAY_CANTEEN_B_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_CANTEEN_B_SECRET=your_razorpay_secret_here

# Default/Fallback Razorpay (Legacy)
RAZORPAY_KEY_ID=rzp_test_fallback_key
RAZORPAY_KEY_SECRET=fallback_secret
```

### Code Locations to Update

#### 1. Payment Routes Configuration

**File:** `server/routes/payment.ts`
**Lines:** 12-16

```typescript
// Get Razorpay credentials based on canteen
function getRazorpayCredentials(canteenId: string) {
  switch (canteenId) {
    case "canteen-a":
      return {
        key_id: process.env.RAZORPAY_CANTEEN_A_KEY_ID,
        key_secret: process.env.RAZORPAY_CANTEEN_A_SECRET,
      };
    case "canteen-b":
      return {
        key_id: process.env.RAZORPAY_CANTEEN_B_KEY_ID,
        key_secret: process.env.RAZORPAY_CANTEEN_B_SECRET,
      };
    default:
      return {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      };
  }
}
```

#### 2. Frontend Razorpay Key Configuration

**File:** `client/pages/user/Payment.tsx`
**Lines:** 85-95

```typescript
// Get Razorpay key based on canteen
const getRazorpayKey = async (canteenId: string) => {
  const response = await fetch(`/api/payment/razorpay-config/${canteenId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
  });
  const data = await response.json();
  return data.data.key;
};
```

#### 3. Payment Processing

**File:** `server/routes/payment.ts`
**Lines:** 49-65

```typescript
// Create Razorpay order with canteen-specific credentials
router.post("/create-order", authenticateToken, async (req, res) => {
  const { canteenId } = req.body.orderData;
  const credentials = getRazorpayCredentials(canteenId);

  const razorpay = new Razorpay(credentials);
  // ... rest of the order creation logic
});
```

#### 4. Payment Verification

**File:** `server/routes/payment.ts`
**Lines:** 102-120

```typescript
// Verify payment with canteen-specific secret
router.post("/verify-payment", authenticateToken, async (req, res) => {
  const { canteenId } = req.body.orderData;
  const credentials = getRazorpayCredentials(canteenId);

  // Verify signature with canteen-specific secret
  const expectedSignature = crypto
    .createHmac("sha256", credentials.key_secret)
    .update(body.toString())
    .digest("hex");
});
```

---

## 🏢 Per-Canteen Razorpay Setup

### Why Separate Razorpay Accounts?

- **Financial Separation**: Each canteen can have separate accounting
- **Admin Independence**: Different admins manage their own payments
- **Revenue Tracking**: Separate settlement accounts for each canteen
- **Security**: Isolated payment credentials

### Setup Process for Each Canteen

#### Campus Canteen A Setup

1. **Create Razorpay Account** for Campus Canteen A admin
2. **Get API Credentials** from Razorpay Dashboard
3. **Update Environment Variables**:
   ```env
   RAZORPAY_CANTEEN_A_KEY_ID=rzp_test_canteen_a_key
   RAZORPAY_CANTEEN_A_SECRET=canteen_a_secret_key
   ```

#### Guest House Canteen Setup

1. **Create Razorpay Account** for Guest House admin
2. **Get API Credentials** from Razorpay Dashboard
3. **Update Environment Variables**:
   ```env
   RAZORPAY_CANTEEN_B_KEY_ID=rzp_test_canteen_b_key
   RAZORPAY_CANTEEN_B_SECRET=canteen_b_secret_key
   ```

### Database Schema Updates

**File:** `server/models/index.ts`
**Lines:** 280-290

```typescript
// Enhanced Transaction Schema with canteen-specific Razorpay data
const transactionSchema = new mongoose.Schema({
  // ... existing fields
  razorpayAccountId: { type: String }, // Which Razorpay account was used
  canteenRazorpayKeyId: { type: String }, // Key ID used for this transaction
});
```

---

## 🔧 Environment Variables

### Complete .env File Template

```env
# ================================
# DATABASE CONFIGURATION
# ================================
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/canteen_management?retryWrites=true&w=majority

# ================================
# JWT AUTHENTICATION
# ================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# ================================
# SERVER CONFIGURATION
# ================================
PORT=8080
NODE_ENV=development

# ================================
# CLOUDINARY (QR Code Uploads)
# ================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ================================
# RAZORPAY - CAMPUS CANTEEN A
# ================================
RAZORPAY_CANTEEN_A_KEY_ID=rzp_test_campus_canteen_a_key
RAZORPAY_CANTEEN_A_SECRET=campus_canteen_a_secret_key

# ================================
# RAZORPAY - GUEST HOUSE CANTEEN
# ================================
RAZORPAY_CANTEEN_B_KEY_ID=rzp_test_guest_house_key
RAZORPAY_CANTEEN_B_SECRET=guest_house_secret_key

# ================================
# RAZORPAY - DEFAULT/FALLBACK
# ================================
RAZORPAY_KEY_ID=rzp_test_default_key
RAZORPAY_KEY_SECRET=default_secret_key

# ================================
# PRODUCTION SETTINGS
# (Comment out the test keys above and use these for production)
# ================================
# RAZORPAY_CANTEEN_A_KEY_ID=rzp_live_campus_canteen_a_key
# RAZORPAY_CANTEEN_A_SECRET=live_campus_canteen_a_secret
# RAZORPAY_CANTEEN_B_KEY_ID=rzp_live_guest_house_key
# RAZORPAY_CANTEEN_B_SECRET=live_guest_house_secret
```

---

## ✅ Quick Setup Checklist

### MongoDB Setup

- [ ] Create MongoDB Atlas account (or set up local MongoDB)
- [ ] Create database cluster
- [ ] Get connection string
- [ ] Update `server/.env` with `DATABASE_URI`
- [ ] Test connection by starting the server

### Razorpay Setup - Campus Canteen A

- [ ] Create Razorpay account for Campus Canteen A admin
- [ ] Get API credentials from Razorpay dashboard
- [ ] Update `RAZORPAY_CANTEEN_A_KEY_ID` in `.env`
- [ ] Update `RAZORPAY_CANTEEN_A_SECRET` in `.env`
- [ ] Test payment with Campus Canteen A

### Razorpay Setup - Guest House Canteen

- [ ] Create Razorpay account for Guest House admin
- [ ] Get API credentials from Razorpay dashboard
- [ ] Update `RAZORPAY_CANTEEN_B_KEY_ID` in `.env`
- [ ] Update `RAZORPAY_CANTEEN_B_SECRET` in `.env`
- [ ] Test payment with Guest House Canteen

### Security

- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Use HTTPS in production
- [ ] Restrict database access to specific IPs
- [ ] Use live Razorpay keys in production (not test keys)

---

## 🚨 Important Security Notes

1. **Never commit `.env` file** to version control
2. **Use different credentials** for test and production
3. **Regularly rotate** API keys and secrets
4. **Monitor Razorpay dashboards** for suspicious activity
5. **Use webhook signatures** to verify payment authenticity
6. **Implement rate limiting** on payment endpoints

---

## 📞 Support Contacts

- **MongoDB Issues**: MongoDB Atlas Support
- **Razorpay Issues**: Razorpay Support Team
- **System Configuration**: Contact Super Admin
- **Payment Issues**: Contact respective canteen admin

---

_Last Updated: December 2024_
_Version: 1.0_
