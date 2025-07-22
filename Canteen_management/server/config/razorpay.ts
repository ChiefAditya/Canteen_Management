import Razorpay from "razorpay";

interface RazorpayCredentials {
  key_id: string;
  key_secret: string;
}

interface CanteenRazorpayConfig {
  canteenId: string;
  canteenName: string;
  credentials: RazorpayCredentials;
  razorpayInstance: Razorpay;
}

/**
 * Get Razorpay credentials based on canteen ID
 * Each canteen can have its own Razorpay account for separate financial management
 */
export function getRazorpayCredentials(canteenId: string): RazorpayCredentials {
  switch (canteenId) {
    case "canteen-a":
      return {
        key_id:
          process.env.RAZORPAY_CANTEEN_A_KEY_ID || "rzp_test_placeholder_a",
        key_secret: process.env.RAZORPAY_CANTEEN_A_SECRET || "test_secret_a",
      };

    case "canteen-b":
      return {
        key_id:
          process.env.RAZORPAY_CANTEEN_B_KEY_ID || "rzp_test_placeholder_b",
        key_secret: process.env.RAZORPAY_CANTEEN_B_SECRET || "test_secret_b",
      };

    default:
      // Fallback to default Razorpay credentials
      return {
        key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_default",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "test_secret_default",
      };
  }
}

/**
 * Get Razorpay instance for specific canteen
 */
export function getRazorpayInstance(canteenId: string): Razorpay {
  const credentials = getRazorpayCredentials(canteenId);

  return new Razorpay({
    key_id: credentials.key_id,
    key_secret: credentials.key_secret,
  });
}

/**
 * Get all canteen Razorpay configurations
 */
export function getAllCanteenRazorpayConfigs(): CanteenRazorpayConfig[] {
  const canteens = [
    {
      canteenId: "canteen-a",
      canteenName: "Campus Canteen A",
    },
    {
      canteenId: "canteen-b",
      canteenName: "Guest House Canteen",
    },
  ];

  return canteens.map((canteen) => ({
    ...canteen,
    credentials: getRazorpayCredentials(canteen.canteenId),
    razorpayInstance: getRazorpayInstance(canteen.canteenId),
  }));
}

/**
 * Validate Razorpay credentials for a canteen
 */
export function validateRazorpayCredentials(canteenId: string): boolean {
  const credentials = getRazorpayCredentials(canteenId);

  // Check if credentials are not placeholder values
  const isValidKeyId =
    credentials.key_id &&
    !credentials.key_id.includes("placeholder") &&
    credentials.key_id.startsWith("rzp_");

  const isValidSecret =
    credentials.key_secret &&
    !credentials.key_secret.includes("placeholder") &&
    !credentials.key_secret.includes("test_secret");

  return isValidKeyId && isValidSecret;
}

/**
 * Get canteen name from canteen ID
 */
export function getCanteenName(canteenId: string): string {
  switch (canteenId) {
    case "canteen-a":
      return "Campus Canteen A";
    case "canteen-b":
      return "Guest House Canteen";
    default:
      return "Unknown Canteen";
  }
}

/**
 * Get public Razorpay key for frontend (only key_id, not secret)
 */
export function getPublicRazorpayKey(canteenId: string): string {
  const credentials = getRazorpayCredentials(canteenId);
  return credentials.key_id;
}

/**
 * Check if canteen has valid Razorpay configuration
 */
export function hasValidRazorpayConfig(canteenId: string): {
  isValid: boolean;
  message: string;
} {
  if (!validateRazorpayCredentials(canteenId)) {
    return {
      isValid: false,
      message: `Razorpay credentials not configured for ${getCanteenName(canteenId)}. Please contact the administrator.`,
    };
  }

  return {
    isValid: true,
    message: "Razorpay configuration is valid",
  };
}

export default {
  getRazorpayCredentials,
  getRazorpayInstance,
  getAllCanteenRazorpayConfigs,
  validateRazorpayCredentials,
  getCanteenName,
  getPublicRazorpayKey,
  hasValidRazorpayConfig,
};
