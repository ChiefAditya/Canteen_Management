import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Heart, ThumbsUp } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItems: string[];
  onSubmit: (feedback: {
    rating: number;
    comment: string;
    recommendation: boolean;
  }) => void;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  orderId,
  orderItems,
  onSubmit,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommendation, setRecommendation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        comment,
        recommendation,
      });
      // Reset form
      setRating(0);
      setComment("");
      setRecommendation(false);
      onClose();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarIcon = ({ filled, hovered, onClick, onHover, onLeave }: any) => (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="focus:outline-none transition-colors"
    >
      <Star
        className={`w-8 h-8 transition-colors ${
          filled || hovered
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300 hover:text-yellow-200"
        }`}
      />
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            How was your meal?
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us improve our service. Please rate your
            experience with order #{orderId?.slice(-6)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Items */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Items delivered:
            </Label>
            <div className="mt-2">
              {orderItems.map((item, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block mr-2 mb-2"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Rating Section */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Overall Rating *
            </Label>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= rating}
                  hovered={star <= hoveredRating}
                  onClick={() => setRating(star)}
                  onHover={() => setHoveredRating(star)}
                  onLeave={() => setHoveredRating(0)}
                />
              ))}
            </div>
            <div className="text-sm text-gray-500">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "Poor - Needs significant improvement"}
              {rating === 2 && "Fair - Below expectations"}
              {rating === 3 && "Good - Meets expectations"}
              {rating === 4 && "Very Good - Exceeds expectations"}
              {rating === 5 && "Excellent - Outstanding quality"}
            </div>
          </div>

          {/* Comment Section */}
          <div>
            <Label
              htmlFor="comment"
              className="text-sm font-medium text-gray-700"
            >
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience - food quality, delivery time, packaging, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 min-h-[80px]"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recommendation"
              checked={recommendation}
              onChange={(e) => setRecommendation(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label
              htmlFor="recommendation"
              className="text-sm text-gray-700 cursor-pointer flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />I would recommend this canteen to
              others
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
