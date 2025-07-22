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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

interface QRUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  canteenId: string;
  canteenName: string;
  onUpload: (file: File, canteenId: string) => Promise<void>;
}

export default function QRUploadModal({
  isOpen,
  onClose,
  canteenId,
  canteenName,
  onUpload,
}: QRUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");

    try {
      await onUpload(selectedFile, canteenId);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setError("Failed to upload QR code. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setSuccess(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Payment QR Code</DialogTitle>
          <DialogDescription>
            Upload a QR code for payment processing at {canteenName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                QR code uploaded successfully!
              </AlertDescription>
            </Alert>
          )}

          {!selectedFile ? (
            <div>
              <Label
                htmlFor="qr-upload"
                className="cursor-pointer block w-full"
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Click to upload QR code
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </Label>
              <Input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="QR Code Preview"
                  className="w-full max-w-64 mx-auto rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              QR Code Guidelines:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Ensure QR code is clear and not blurry</li>
              <li>
                • QR should contain payment information (UPI/Bank details)
              </li>
              <li>• Test QR code before uploading</li>
              <li>• Square format works best</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || success}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? "Uploading..." : "Upload QR Code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
