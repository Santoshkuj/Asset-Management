"use client";

import { Plus, Upload } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { uploadAsset } from "@/actions/dashboardActions";

type Category = {
  id: number;
  name: string;
  createdAt: Date;
};
type FormState = {
  title: string;
  description: string;
  categoryId: string;
  file: File | null;
};
type Signature = {
  signature: string;
  timestamp: number;
  apiKey: string;
};
type CloudinaryResponseType = {
  secure_url: string;
};

interface UploadProps {
  categories: Category[];
}
const UploadAsset = ({ categories }: UploadProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    categoryId: "",
    file: null,
  });

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFormState((prev) => ({ ...prev, file }));
    }
  }

  async function getCloudinarySignature(): Promise<Signature> {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const response = await fetch("/api/cloudinary/signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timestamp }),
    });
    if (!response.ok) {
      throw new Error("Failed to create cloudinary signature");
    }
    return response.json();
  }

  async function handleAssetUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);
    try {
      const { signature, apiKey, timestamp } = await getCloudinarySignature();
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", formState.file as File);
      cloudinaryData.append("api_key", apiKey);
      cloudinaryData.append("timestamp", timestamp.toString());
      cloudinaryData.append("signature", signature);
      cloudinaryData.append("folder", "next-assetManagement");

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUD_NAME}/auto/upload`
      );
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      const cloudinaryPromise = new Promise<CloudinaryResponseType>(
        (resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } else {
              reject(new Error("Failed uploading to cloudinary"));
            }
          };
          xhr.onerror = () =>
            reject(new Error("Failed uploading to cloudinary"));
        }
      );
      xhr.send(cloudinaryData);
      const cloudinaryResponse = await cloudinaryPromise;
      const formData = new FormData();
      formData.append("title", formState.title);
      formData.append("description", formState.description);
      formData.append("categoryId", formState.categoryId);
      formData.append("fileUrl", cloudinaryResponse.secure_url);
      formData.append("thumbnailUrl", cloudinaryResponse.secure_url);

      const result = await uploadAsset(formData);
      if (result.success) {
        setOpen(false);
        setFormState({
          title: "",
          description: "",
          categoryId: "",
          file: null,
        });
      } else {
        throw new Error(result?.error);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-500 hover:bg-teal-600 text-white cursor-pointer">
          <Plus className="mr-2 w-4 h-4" />
          Upload Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload New Assets</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAssetUpload} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              value={formState.title}
              onChange={handleInputChange}
              id="title"
              name="title"
              placeholder="Write title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              value={formState.description}
              onChange={handleInputChange}
              id="description"
              name="description"
              placeholder="Write description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formState.categoryId}
              onValueChange={(value) =>
                setFormState((prev) => ({ ...prev, categoryId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              type="file"
              onChange={handleFileChange}
              id="file"
              accept="image/*"
            />
          </div>
          {uploading && uploadProgress > 0 && (
            <div className="mb-5 w-full bg-stone-100 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
              <p className="text-xs text-slate-500 mt-2 text-right">
                {uploadProgress}% upload
              </p>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button type="submit">
              <Upload className="mr-2 h-5 w-5" />
              Upload Asset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default UploadAsset;
