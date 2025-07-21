"use client";

import React, { useRef, useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";

interface FileInputWrapperProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  children: React.ReactNode;
  accept?: string;
}

export default function FileInputWrapper({
  onFileSelect,
  disabled = false,
  children,
  accept = "image/*",
}: FileInputWrapperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      const files = Array.from(event.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));
      if (imageFile) {
        onFileSelect(imageFile);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        cursor-pointer transition-all duration-200
        ${isDragging ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        style={{ display: "none" }}
      />
      {children}
    </div>
  );
}
