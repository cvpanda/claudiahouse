"use client";

import { useState, useCallback } from "react";

export interface ImageUploadResult {
  url: string;
  publicId: string;
  fileName: string;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadToGoogleDrive = useCallback(
    async (file: File): Promise<ImageUploadResult> => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/google-drive", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Error al subir la imagen");
        }

        const result = await response.json();
        setUploadProgress(100);

        return result;
      } catch (error) {
        console.error("Error uploading to Google Drive:", error);
        throw error;
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    []
  );

  const captureFromCamera = useCallback(async (): Promise<File | null> => {
    try {
      // Verificar si el dispositivo soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("La cámara no está disponible en este dispositivo");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Cámara trasera por defecto
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      return new Promise((resolve) => {
        // Crear un elemento video temporal
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          // Crear canvas para capturar la imagen
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          if (context) {
            context.drawImage(video, 0, 0);

            // Convertir a blob
            canvas.toBlob(
              (blob) => {
                // Detener el stream
                stream.getTracks().forEach((track) => track.stop());

                if (blob) {
                  const file = new File([blob], `photo-${Date.now()}.jpg`, {
                    type: "image/jpeg",
                  });
                  resolve(file);
                } else {
                  resolve(null);
                }
              },
              "image/jpeg",
              0.9
            );
          }
        };
      });
    } catch (error) {
      console.error("Error accessing camera:", error);
      return null;
    }
  }, []);

  const selectFromGallery = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      // Verificar si el navegador soporta File System Access API (más moderno)
      if ("showOpenFilePicker" in window) {
        // Usar API moderna para evitar problemas de navegación
        (window as any)
          .showOpenFilePicker({
            types: [
              {
                description: "Imágenes",
                accept: {
                  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                },
              },
            ],
            multiple: false,
          })
          .then((fileHandles: any[]) => {
            if (fileHandles.length > 0) {
              return fileHandles[0].getFile();
            }
            return null;
          })
          .then((file: File | null) => {
            resolve(file);
          })
          .catch(() => {
            resolve(null);
          });
      } else {
        // Fallback para navegadores más antiguos
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.style.display = "none";

        // Agregar al DOM temporalmente
        document.body.appendChild(input);

        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          // Limpiar el DOM
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(file || null);
        };

        // También manejar el caso de cancelación
        const handleFocus = () => {
          setTimeout(() => {
            if (document.body.contains(input)) {
              document.body.removeChild(input);
              resolve(null);
            }
          }, 300);
          window.removeEventListener("focus", handleFocus);
        };

        window.addEventListener("focus", handleFocus);

        // Usar timeout para evitar problemas de navegación
        setTimeout(() => {
          input.click();
        }, 100);
      }
    });
  }, []);

  const compressImage = useCallback(
    async (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          // Calcular dimensiones manteniendo aspecto
          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          if (context) {
            // Dibujar imagen redimensionada
            context.fillStyle = "white";
            context.fillRect(0, 0, width, height);
            context.drawImage(img, 0, 0, width, height);

            // Convertir a blob comprimido
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              "image/jpeg",
              quality
            );
          }
        };

        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  return {
    isUploading,
    uploadProgress,
    uploadToGoogleDrive,
    captureFromCamera,
    selectFromGallery,
    compressImage,
  };
}
