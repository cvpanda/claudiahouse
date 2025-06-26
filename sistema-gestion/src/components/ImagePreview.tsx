"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  convertGoogleDriveUrl,
  getImageSharingInstructions,
  getGoogleDriveAlternatives,
} from "@/lib/utils";

interface ImagePreviewProps {
  url: string;
  alt: string;
  className?: string;
  showInstructions?: boolean;
}

export default function ImagePreview({
  url,
  alt,
  className = "h-32 w-32 object-cover rounded-md border",
  showInstructions = true,
}: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [showOriginalUrl, setShowOriginalUrl] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  if (!url) return null;

  const alternativeUrls = getGoogleDriveAlternatives(url);
  const currentUrl = alternativeUrls[currentUrlIndex];
  const isConverted = currentUrl !== url;
  const isGoogleDrive = url.includes("drive.google.com");

  const handleImageError = () => {
    // Si hay más URLs alternativas, intentar la siguiente
    if (currentUrlIndex < alternativeUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleRetry = () => {
    setImageError(false);
    setCurrentUrlIndex(0);
    setRetryKey((prev) => prev + 1);
  };

  const openInNewWindow = (urlToOpen: string) => {
    window.open(urlToOpen, "_blank");
  };

  // Reset cuando cambia la URL
  useEffect(() => {
    setImageError(false);
    setCurrentUrlIndex(0);
    setRetryKey((prev) => prev + 1);
  }, [url]);

  if (imageError) {
    return (
      <div className="space-y-3">
        <div
          className={`${className} bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 p-4`}
        >
          <AlertCircle className="h-8 w-8 mb-2" />
          <span className="text-xs text-center px-2 mb-2">
            No se pudo cargar la imagen
          </span>
          <span className="text-xs text-center px-2 mb-2 text-gray-400">
            ({alternativeUrls.length} formato
            {alternativeUrls.length > 1 ? "s" : ""} intentado
            {alternativeUrls.length > 1 ? "s" : ""})
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reintentar
          </button>
        </div>

        {showInstructions && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="text-amber-800 font-medium">
                  Problema con la imagen
                </p>
                <div className="text-amber-700 whitespace-pre-line">
                  {getImageSharingInstructions(url)}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openInNewWindow(url)}
                    className="flex items-center text-xs text-amber-600 hover:text-amber-800 bg-amber-100 px-2 py-1 rounded"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Verificar URL original
                  </button>

                  {isConverted && (
                    <button
                      type="button"
                      onClick={() => openInNewWindow(currentUrl)}
                      className="flex items-center text-xs text-amber-600 hover:text-amber-800 bg-amber-100 px-2 py-1 rounded"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Verificar URL convertida
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowOriginalUrl(!showOriginalUrl)}
                    className="flex items-center text-xs text-amber-600 hover:text-amber-800 bg-amber-100 px-2 py-1 rounded"
                  >
                    {showOriginalUrl ? (
                      <EyeOff className="h-3 w-3 mr-1" />
                    ) : (
                      <Eye className="h-3 w-3 mr-1" />
                    )}
                    {showOriginalUrl ? "Ocultar" : "Ver"} detalles técnicos
                  </button>
                </div>

                {showOriginalUrl && (
                  <div className="text-xs text-amber-600 bg-amber-25 p-3 rounded border mt-2">
                    <p className="font-medium mb-2">URL original:</p>
                    <p className="break-all font-mono bg-white p-1 rounded mb-3">
                      {url}
                    </p>

                    <p className="font-medium mb-2">
                      URLs intentadas ({alternativeUrls.length}):
                    </p>
                    {alternativeUrls.map((altUrl, index) => (
                      <div key={index} className="mb-2">
                        <p className="text-xs mb-1">
                          {index + 1}.{" "}
                          {index === 0
                            ? "(Principal)"
                            : index === 1
                            ? "(Thumbnail)"
                            : index === 2
                            ? "(GoogleUserContent)"
                            : "(Original)"}
                        </p>
                        <p className="break-all font-mono bg-white p-1 rounded text-xs">
                          {altUrl}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <img
        key={`${retryKey}-${currentUrlIndex}`}
        src={currentUrl}
        alt={alt}
        className={className}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />

      {isConverted && showInstructions && (
        <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded p-2">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            <span>
              URL de Google Drive convertida automáticamente
              {alternativeUrls.length > 1 && currentUrlIndex > 0 && (
                <span className="text-green-500">
                  {" "}
                  (formato {currentUrlIndex + 1})
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
