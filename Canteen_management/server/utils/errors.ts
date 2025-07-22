import { Response } from "express";

export const handleAPIError = (
  res: Response,
  error: any,
  defaultMessage: string = "Internal server error",
): void => {
  console.error("API Error:", error);

  if (error.name === "ValidationError") {
    const validationErrors = Object.values(error.errors).map(
      (err: any) => err.message,
    );
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors,
    });
    return;
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
    return;
  }

  if (error.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: defaultMessage,
  });
};
