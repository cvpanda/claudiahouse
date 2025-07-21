"use client";

import React, { useState } from "react";
import { Camera, Image as ImageIcon, Upload, X, Check, AlertCircle } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useIsMobile } from "@/hooks/useIsMobile";

interface MobileImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  onCancel?: () => void;
  currentImageUrl?: string;
  isOpen: boolean;
}

export default function MobileImageUploader({
  onImageUploaded,
  onCancel,
  currentImageUrl,
  isOpen,
}: MobileImageUploaderProps) {
  const isMobile = useIsMobile();
  const {
    isUploading,
    uploadProgress,
    uploadToGoogleDrive,
    captureFromCamera,
    selectFromGallery,
    compressImage,
  } = useImageUpload();

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(true);

  const handleFileSelection = async (file: File) => {
    try {
      setError(null);
      setShowOptions(false);

      // Mostrar preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Comprimir imagen si es necesario
      const compressedFile = await compressImage(file);

      // Subir a Google Drive
      const result = await uploadToGoogleDrive(compressedFile);

      // Notificar al componente padre
      onImageUploaded(result.url);

      // Limpiar preview URL
      URL.revokeObjectURL(preview);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Error al subir la imagen. Inténtalo de nuevo.");
      setPreviewUrl(null);
      setShowOptions(true);
    }
  };

  const handleCameraCapture = async () => {
    try {
      setError(null);
      const file = await captureFromCamera();
      
      if (file) {
        await handleFileSelection(file);
      } else {
        setError("No se pudo capturar la imagen");
      }
    } catch (error) {
      console.error("Error capturing from camera:", error);
      setError("Error al acceder a la cámara");
    }
  };

  const handleGallerySelection = async () => {
    try {
      setError(null);
      const file = await selectFromGallery();
      
      if (file) {
        await handleFileSelection(file);
      }
    } catch (error) {
      console.error("Error selecting from gallery:", error);
      setError("Error al seleccionar la imagen");
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setError(null);
    setShowOptions(true);
    onCancel?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cargar Imagen
          </h3>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {isUploading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
                <span className="text-sm text-blue-700">Subiendo imagen...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-blue-600 mt-1 text-right">
                {uploadProgress}%
              </div>
            </div>
          )}

          {previewUrl && !isUploading && (
            <div className="mb-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="text-sm">Imagen cargada exitosamente</span>
              </div>
            </div>
          )}

          {showOptions && !isUploading && (
            <div className="space-y-3">
              {isMobile ? (
                <>
                  {/* Opción Cámara - Solo en móvil */}
                  <button
                    onClick={handleCameraCapture}
                    className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Camera className="h-6 w-6 text-blue-600" />
                    <span className="text-blue-700 font-medium">
                      Tomar Foto
                    </span>
                  </button>

                  {/* Opción Galería */}
                  <button
                    onClick={handleGallerySelection}
                    className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <ImageIcon className="h-6 w-6 text-green-600" />
                    <span className="text-green-700 font-medium">
                      Seleccionar de Galería
                    </span>
                  </button>
                </>
              ) : (
                /* Opción Desktop - Solo seleccionar archivo */
                <button
                  onClick={handleGallerySelection}
                  className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="h-6 w-6 text-blue-600" />
                  <span className="text-blue-700 font-medium">
                    Seleccionar Archivo
                  </span>
                </button>
              )}

              <div className="text-xs text-gray-500 text-center">
                Formatos soportados: JPG, PNG, WEBP
                <br />
                Tamaño máximo: 10MB
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showOptions && !isUploading && (
          <div className="p-4 border-t border-gray-200 flex space-x-3">
            <button
              onClick={() => {
                setPreviewUrl(null);
                setShowOptions(true);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cargar Otra
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
