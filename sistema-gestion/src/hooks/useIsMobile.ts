"use client";

import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Verificar si es un dispositivo móvil basado en el user agent
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

      // También verificar el ancho de pantalla
      const screenWidth = window.innerWidth;

      const isMobileDevice = mobileRegex.test(userAgent) || screenWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    // Verificar al montar el componente
    checkIsMobile();

    // Escuchar cambios en el tamaño de pantalla
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return isMobile;
}
