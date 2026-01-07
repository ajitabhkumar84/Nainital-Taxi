"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Link as LinkIcon, Loader2, AlertCircle, Image as ImageIcon, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryImage } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  recommendedSize?: string;
  aspectRatio?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder = "packages",
  label = "Image",
  recommendedSize = "1920 x 1080",
  aspectRatio = "16:9",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [folder, onChange]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: isUploading,
    onDrop,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection?.errors[0]?.code === 'file-too-large') {
        setError('File too large. Maximum size is 5MB.');
      } else if (rejection?.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      } else {
        setError('Upload failed. Please try again.');
      }
    },
  });

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="block font-body text-sm text-ink/60">
        {label}
      </label>

      {/* Dimension Recommendation */}
      <div className="flex items-center gap-2 text-xs text-ink/50 font-body">
        <ImageIcon className="w-3 h-3" />
        <span>Recommended: {recommendedSize} ({aspectRatio})</span>
      </div>

      {/* Current Image Preview */}
      {value && (
        <div className="relative inline-block">
          <div className="w-48 h-32 rounded-xl overflow-hidden border-3 border-ink shadow-retro-sm">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1.5 bg-coral text-white rounded-full border-2 border-ink hover:bg-coral/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Options with Dropzone */}
      {!value && (
        <div className="flex flex-col gap-3">
          {/* Dropzone Area */}
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 border-3 border-dashed rounded-xl font-body transition-all cursor-pointer",
              isDragActive
                ? "border-teal bg-teal/10 text-teal"
                : "border-ink/30 text-ink/70 hover:border-ink hover:bg-sunrise/20",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : isDragActive ? (
              <>
                <Upload className="w-8 h-8" />
                <span>Drop image here</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <span>Drag & drop image here, or click to select</span>
                <span className="text-xs text-ink/50">
                  {recommendedSize} ({aspectRatio}) recommended
                </span>
              </>
            )}
          </div>

          {/* URL Input Toggle */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-sm text-teal hover:underline font-body flex items-center gap-1"
            >
              <LinkIcon className="w-4 h-4" />
              Or enter image URL
            </button>
          </div>

          {/* URL Input */}
          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-teal text-white border-3 border-ink rounded-xl font-body hover:bg-teal/80 transition-colors"
              >
                Use URL
              </button>
            </div>
          )}

          {/* File Requirements */}
          <p className="text-xs text-ink/50 font-body text-center">
            Max 5MB. Supported: JPEG, PNG, WebP, GIF
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-coral font-body">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// Gallery Uploader for multiple images
interface GalleryUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  maxImages?: number;
  recommendedSize?: string;
  aspectRatio?: string;
}

export function GalleryUploader({
  value,
  onChange,
  folder = "packages/gallery",
  label = "Gallery Images",
  maxImages = 10,
  recommendedSize = "1200 x 800",
  aspectRatio = "3:2",
}: GalleryUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleUpload = useCallback(async (files: File[]) => {
    setError(null);
    setIsUploading(true);

    const newUrls: string[] = [];

    try {
      for (const file of files) {
        if (value.length + newUrls.length >= maxImages) {
          setError(`Maximum ${maxImages} images allowed`);
          break;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          headers: {
            "x-admin-auth": ADMIN_PASSWORD,
          },
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Upload failed");
        }

        newUrls.push(result.url);
      }

      onChange([...value, ...newUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [folder, maxImages, onChange, value]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    disabled: isUploading || value.length >= maxImages,
    onDrop,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection?.errors[0]?.code === 'file-too-large') {
        setError('File too large. Maximum size is 5MB per image.');
      } else if (rejection?.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      } else {
        setError('Upload failed. Please try again.');
      }
    },
  });

  const handleUrlSubmit = () => {
    if (urlInput.trim() && value.length < maxImages) {
      onChange([...value, urlInput.trim()]);
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-body text-sm text-ink/60">
          {label} ({value.length}/{maxImages})
        </label>
        <span className="text-xs text-ink/50 font-body flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          {recommendedSize} ({aspectRatio})
        </span>
      </div>

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-ink">
                <img
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-1 -right-1 p-1 bg-coral text-white rounded-full border-2 border-ink opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Options with Dropzone */}
      {value.length < maxImages && (
        <div className="flex flex-col gap-2">
          {/* Dropzone Area */}
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 border-3 border-dashed rounded-xl font-body text-sm transition-all cursor-pointer",
              isDragActive
                ? "border-teal bg-teal/10 text-teal"
                : "border-ink/30 text-ink/70 hover:border-ink hover:bg-sunrise/20",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : isDragActive ? (
              <>
                <Upload className="w-6 h-6" />
                <span>Drop images here</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span>Drag & drop images, or click to select</span>
                <span className="text-xs text-ink/50">
                  {recommendedSize} ({aspectRatio}) recommended
                </span>
              </>
            )}
          </div>

          {/* URL Input Toggle */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-teal hover:underline font-body flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              Or add image URL
            </button>
          </div>

          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border-3 border-ink rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-3 py-2 bg-teal text-white border-3 border-ink rounded-xl font-body text-sm hover:bg-teal/80"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-coral font-body">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// Gallery Uploader with names for each image
interface GalleryWithNamesUploaderProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  folder?: string;
  label?: string;
  maxImages?: number;
  recommendedSize?: string;
  aspectRatio?: string;
}

export function GalleryWithNamesUploader({
  value,
  onChange,
  folder = "packages/gallery",
  label = "Gallery Images",
  maxImages = 10,
  recommendedSize = "800 x 600",
  aspectRatio = "4:3",
}: GalleryWithNamesUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleUpload = useCallback(async (files: File[]) => {
    setError(null);
    setIsUploading(true);

    const newImages: GalleryImage[] = [];

    try {
      for (const file of files) {
        if (value.length + newImages.length >= maxImages) {
          setError(`Maximum ${maxImages} images allowed`);
          break;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          headers: {
            "x-admin-auth": ADMIN_PASSWORD,
          },
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Upload failed");
        }

        // Use file name (without extension) as default name
        const defaultName = file.name.replace(/\.[^/.]+$/, "");
        newImages.push({
          url: result.url,
          name: defaultName,
        });
      }

      onChange([...value, ...newImages]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [folder, maxImages, onChange, value]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    disabled: isUploading || value.length >= maxImages,
    onDrop,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection?.errors[0]?.code === 'file-too-large') {
        setError('File too large. Maximum size is 5MB per image.');
      } else if (rejection?.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      } else {
        setError('Upload failed. Please try again.');
      }
    },
  });

  const handleUrlSubmit = () => {
    if (urlInput.trim() && nameInput.trim() && value.length < maxImages) {
      onChange([...value, { url: urlInput.trim(), name: nameInput.trim() }]);
      setUrlInput("");
      setNameInput("");
      setShowUrlInput(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingName("");
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingName(value[index].name);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingName.trim()) {
      const newValue = [...value];
      newValue[editingIndex] = {
        ...newValue[editingIndex],
        name: editingName.trim(),
      };
      onChange(newValue);
      setEditingIndex(null);
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingName("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-body text-sm text-ink/60">
          {label} ({value.length}/{maxImages})
        </label>
        <span className="text-xs text-ink/50 font-body flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          {recommendedSize} ({aspectRatio})
        </span>
      </div>

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((image, index) => (
            <div key={index} className="relative group bg-white rounded-lg border-2 border-ink p-2">
              <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-ink/20 mb-2">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Image Name */}
              {editingIndex === index ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full px-2 py-1 border-2 border-ink rounded text-xs font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                    placeholder="Image name"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="flex-1 px-2 py-1 bg-whatsapp text-white text-xs rounded border border-ink hover:bg-whatsapp/80"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 px-2 py-1 bg-gray-200 text-ink text-xs rounded border border-ink hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-body text-ink/70 truncate flex-1">
                    {image.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(index)}
                    className="p-1 text-teal hover:bg-teal/10 rounded transition-colors flex-shrink-0"
                    title="Edit name"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-1 -right-1 p-1 bg-coral text-white rounded-full border-2 border-ink opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Options with Dropzone */}
      {value.length < maxImages && (
        <div className="flex flex-col gap-2">
          {/* Dropzone Area */}
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 border-3 border-dashed rounded-xl font-body text-sm transition-all cursor-pointer",
              isDragActive
                ? "border-teal bg-teal/10 text-teal"
                : "border-ink/30 text-ink/70 hover:border-ink hover:bg-sunrise/20",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : isDragActive ? (
              <>
                <Upload className="w-6 h-6" />
                <span>Drop images here</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span>Drag & drop images, or click to select</span>
                <span className="text-xs text-ink/50">
                  {recommendedSize} ({aspectRatio}) recommended • Names can be edited after upload
                </span>
              </>
            )}
          </div>

          {/* URL Input Toggle */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-teal hover:underline font-body flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              Or add image URL with name
            </button>
          </div>

          {showUrlInput && (
            <div className="space-y-2 p-3 bg-sunrise/10 rounded-lg border-2 border-ink/20">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border-3 border-ink rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Image name (e.g., Nainital Lake View)"
                className="w-full px-3 py-2 border-3 border-ink rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim() || !nameInput.trim()}
                className="w-full px-3 py-2 bg-teal text-white border-3 border-ink rounded-xl font-body text-sm hover:bg-teal/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Image
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-coral font-body">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
