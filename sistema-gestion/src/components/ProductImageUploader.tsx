"use client";

import React, { useState } from "react";
import { Camera, Upload, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileImageUploader from "@/components/MobileImageUploader";
import ImagePreview from "@/components/ImagePreview";

interface ProductImageUploaderProps {
  currentImageUrl: string;
  onImageChange: (imageUrl: string) => void;
  disabled?: boolean;
}

export default function ProductImageUploader({
  currentImageUrl,
  onImageChange,
  disabled = false,
}: ProductImageUploaderProps) {
  const isMobile = useIsMobile();
  const [showMobileUploader, setShowMobileUploader] = useState(false);

  const handleImageUploaded = (imageUrl: string) => {
    onImageChange(imageUrl);
    setShowMobileUploader(false);
  };

  return (
    <div className="space-y-4">
      {/* Input manual para URL (siempre visible) */}
      <div>
        <label
          htmlFor="imageUrl"
          className="block text-sm font-medium text-gray-700"
        >
          URL de Imagen
        </label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          placeholder="https://ejemplo.com/imagen.jpg"
          value={currentImageUrl}
          onChange={(e) => onImageChange(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-sm text-gray-500">
          Ingresa una URL de imagen o usa las opciones de carga {isMobile ? "móvil" : ""} a continuación.
        </p>
      </div>

      {/* Botones de carga según el dispositivo */}
      <div className="space-y-2">
        {isMobile ? (
          /* Opciones móviles */
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setShowMobileUploader(true)}
              disabled={disabled}
              className="flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Smartphone className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 font-medium">
                Cargar desde Móvil
              </span>
            </button>
            <div className="flex items-center space-x-2 text-xs text-gray-500 justify-center">
              <Camera className="h-4 w-4" />
              <span>Cámara o galería • Sube automáticamente a Google Drive</span>
            </div>
          </div>
        ) : (
          /* Opción desktop tradicional */
          <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              En dispositivos móviles podrás tomar fotos directamente
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Por ahora, ingresa una URL de imagen en el campo superior
            </p>
          </div>
        )}
      </div>

      {/* Vista previa de la imagen */}
      {currentImageUrl && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vista Previa
          </label>
          <ImagePreview
            url={currentImageUrl}
            alt="Vista previa del producto"
            className="h-32 w-32 object-cover rounded-md border shadow-sm"
            showInstructions={true}
          />
        </div>
      )}

      {/* Modal de carga móvil */}
      <MobileImageUploader
        isOpen={showMobileUploader}
        onImageUploaded={handleImageUploaded}
        onCancel={() => setShowMobileUploader(false)}
        currentImageUrl={currentImageUrl}
      />
    </div>
  );
}
