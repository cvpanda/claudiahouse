import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGoogleDrive } from "@/lib/googleDrive";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 10MB" },
        { status: 400 }
      );
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Optimizar imagen con Sharp
    try {
      const optimizedBuffer = await sharp(buffer)
        .resize(1920, 1920, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toBuffer();

      buffer = Buffer.from(optimizedBuffer);
    } catch (sharpError) {
      console.warn("Error optimizing image with Sharp:", sharpError);
      // Si falla la optimización, usar el buffer original
    }

    // Generar nombre único
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `product-image-${timestamp}.${extension}`;

    // Subir a Google Drive
    const result = await uploadFileToGoogleDrive(
      buffer,
      fileName,
      "image/jpeg"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in upload API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "Se requiere el ID del archivo" },
        { status: 400 }
      );
    }

    // Aquí podrías agregar validación de permisos
    // Verificar que el usuario tenga permisos para eliminar la imagen

    const { deleteFileFromGoogleDrive } = await import("@/lib/googleDrive");
    await deleteFileFromGoogleDrive(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Error al eliminar el archivo" },
      { status: 500 }
    );
  }
}
