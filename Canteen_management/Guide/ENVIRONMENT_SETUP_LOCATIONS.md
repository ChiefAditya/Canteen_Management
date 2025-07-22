# 📍 Environment Setup Locations - Quick Reference

This file provides exact file paths and line numbers where configurations need to be updated.

## 🗄️ MongoDB Database Configuration

### 📁 Primary Configuration

- **File**: `server/.env`
- **Variable**: `DATABASE_URI`
- **Example**: `DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/canteen_management`

### 📁 Fallback Locations

- **File**: `server/config/database.hybrid.ts` (Lines 23-30)
- **File**: `server/server.ts` (Lines 15-20)
- **File**: `server/.env.example` (Lines 1-4)

---

## 💳 Razorpay Configuration Locations

### 📁 Environment Variables (Primary Configuration)

**File**: `server/.env`

```env
# Campus Canteen A
RAZORPAY_CANTEEN_A_KEY_ID=rzp_test_campus_key
RAZORPAY_CANTEEN_A_SECRET=campus_secret

# Guest House Canteen
RAZORPAY_CANTEEN_B_KEY_ID=rzp_test_guest_key
RAZORPAY_CANTEEN_B_SECRET=guest_secret

# Default/Fallback
RAZORPAY_KEY_ID=rzp_test_default
RAZORPAY_KEY_SECRET=default_secret
```

### 📁 Code Configuration Files

- **File**: `server/config/razorpay.ts` (Complete configuration manager)
- **File**: `server/routes/payment.ts` (Lines 12-35, 51-65, 102-120)
- **File**: `client/pages/user/Payment.tsx` (Lines 85-95, 140-150)

---

## 🔧 Other Configuration Locations

### JWT Secret

- **File**: `server/.env`
- **Variable**: `JWT_SECRET`

### Cloudinary (QR Upload)

- **File**: `server/.env`
- **Variables**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Server Port

- **File**: `server/.env`
- **Variable**: `PORT=8080`

---

## 🚀 Quick Update Commands

### For MongoDB

```bash
# Update .env file
echo "DATABASE_URI=your_mongodb_connection_string" >> server/.env
```

### For Razorpay Campus Canteen A

```bash
# Update .env file
echo "RAZORPAY_CANTEEN_A_KEY_ID=your_key_id" >> server/.env
echo "RAZORPAY_CANTEEN_A_SECRET=your_secret" >> server/.env
```

### For Razorpay Guest House Canteen

```bash
# Update .env file
echo "RAZORPAY_CANTEEN_B_KEY_ID=your_key_id" >> server/.env
echo "RAZORPAY_CANTEEN_B_SECRET=your_secret" >> server/.env
```

---

## ⚠️ Security Checklist

- [ ] Never commit `.env` file to version control
- [ ] Use different keys for test and production
- [ ] Add `.env` to `.gitignore`
- [ ] Use strong JWT secrets
- [ ] Restrict database IP access
- [ ] Monitor Razorpay dashboards

---

_Last Updated: December 2024_
