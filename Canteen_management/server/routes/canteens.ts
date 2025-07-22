import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { Canteen } from "../models/index.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = Router();

// Get all canteens WITH menu item statistics
router.get("/", async (req: Request, res: Response) => {
  try {
    const canteensWithStats = await Canteen.aggregate([
      // Stage 1: Match only active canteens
      { $match: { isActive: true } },
      // Stage 2: Join with the 'menuitems' collection
      {
        $lookup: {
          from: "menuitems", // This is your confirmed collection name
          localField: "_id",
          foreignField: "canteenId",
          as: "menuItems",
        },
      },
      // Stage 3: Add new fields for the counts
      {
        $addFields: {
          totalMenuItems: { $size: "$menuItems" },
          availableMenuItems: {
            $size: {
              $filter: {
                input: "$menuItems",
                as: "item",
                cond: { $eq: ["$$item.isAvailable", true] },
              },
            },
          },
        },
      },
      // Stage 4: Remove the large menuItems array from the final output
      { $project: { menuItems: 0 } },
      // Stage 5: Sort the final results
      { $sort: { name: 1 } },
    ]);

    res.json({
      success: true,
      data: { canteens: canteensWithStats },
    });
  } catch (error) {
    console.error("Get canteens with stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch canteens",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

// Get single canteen
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) {
      return res.status(404).json({ success: false, message: "Canteen not found" });
    }
    res.json({ success: true, data: { canteen } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch canteen" });
  }
});

// Create new canteen (Admin only)
router.post("/", authenticateToken, requireRole("admin"),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("timing").trim().notEmpty().withMessage("Timing is required"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const newCanteen = new Canteen(req.body);
      await newCanteen.save();
      res.status(201).json({ success: true, data: { canteen: newCanteen } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create canteen" });
    }
  }
);

// Update canteen (Admin only)
router.put( "/:id", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const updatedCanteen = await Canteen.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedCanteen) {
        return res.status(404).json({ success: false, message: "Canteen not found" });
      }
      res.json({ success: true, data: { canteen: updatedCanteen } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update canteen" });
    }
  }
);

// Delete canteen (Admin only)
router.delete( "/:id", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const canteen = await Canteen.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      if (!canteen) {
        return res.status(404).json({ success: false, message: "Canteen not found" });
      }
      res.json({ success: true, message: "Canteen deactivated successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to deactivate canteen" });
    }
  }
);

export default router;