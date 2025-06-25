import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

interface ReportData {
  salesByDay: Array<{ day: string; sales: number; revenue: number }>;
  salesByCategory: Array<{ name: string; value: number; color: string }>;
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
  lowStockProducts: Array<{ name: string; stock: number; minStock: number }>;
  salesByMonth: Array<{ month: string; sales: number; revenue: number }>;
  customerStats: {
    totalCustomers: number;
    wholesaleCustomers: number;
    retailCustomers: number;
  };
  advancedMetrics?: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
    roi: number;
    averageTicket: number;
    revenueGrowth: number;
    salesGrowth: number;
  };
  productAnalysis?: Array<{
    name: string;
    sold: number;
    revenue: number;
    profitMargin: number;
    contribution: number;
  }>;
}

// Extender el tipo jsPDF para incluir autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const useReportExport = () => {
  // Función para capturar gráficos como imagen
  const captureChart = async (chartId: string): Promise<string | null> => {
    try {
      const chartElement = document.getElementById(chartId);
      if (!chartElement) return null;

      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error(`Error capturing chart ${chartId}:`, error);
      return null;
    }
  };

  const exportToPDF = async (reportData: ReportData, period: string) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("Reporte de Ventas y Analytics", 20, 30);

      doc.setFontSize(12);
      doc.text(`Período: ${getPeriodLabel(period)}`, 20, 45);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`,
        20,
        55
      );

      let yPosition = 70;

      // KPIs Summary
      doc.setFontSize(16);
      doc.text("Resumen Ejecutivo", 20, yPosition);
      yPosition += 10;

      const totalRevenue = reportData.salesByDay.reduce(
        (sum, day) => sum + day.revenue,
        0
      );
      const totalSales = reportData.salesByDay.reduce(
        (sum, day) => sum + day.sales,
        0
      );

      const kpiData = [
        ["Métrica", "Valor"],
        ["Ingresos Totales", `$${totalRevenue.toLocaleString("es-ES")}`],
        ["Ventas Realizadas", totalSales.toString()],
        ["Total Clientes", reportData.customerStats.totalCustomers.toString()],
        [
          "Productos con Stock Bajo",
          reportData.lowStockProducts.length.toString(),
        ],
      ];

      doc.autoTable({
        startY: yPosition,
        head: [kpiData[0]],
        body: kpiData.slice(1),
        theme: "striped",
        margin: { left: 20, right: 20 },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Agregar métricas avanzadas si están disponibles
      if (reportData.advancedMetrics) {
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(16);
        doc.text("Métricas Financieras Avanzadas", 20, yPosition);
        yPosition += 10;

        const advancedMetricsData = [
          ["Métrica", "Valor"],
          [
            "Ganancia Bruta",
            `$${reportData.advancedMetrics.grossProfit.toLocaleString(
              "es-ES"
            )}`,
          ],
          [
            "Margen de Ganancia",
            `${reportData.advancedMetrics.profitMargin.toFixed(1)}%`,
          ],
          ["ROI", `${reportData.advancedMetrics.roi.toFixed(1)}%`],
          [
            "Ticket Promedio",
            `$${reportData.advancedMetrics.averageTicket.toLocaleString(
              "es-ES"
            )}`,
          ],
          [
            "Crecimiento Ingresos",
            `${reportData.advancedMetrics.revenueGrowth.toFixed(1)}%`,
          ],
          [
            "Crecimiento Ventas",
            `${reportData.advancedMetrics.salesGrowth.toFixed(1)}%`,
          ],
        ];

        doc.autoTable({
          startY: yPosition,
          head: [advancedMetricsData[0]],
          body: advancedMetricsData.slice(1),
          theme: "striped",
          margin: { left: 20, right: 20 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 20;
      }

      // Capturar y agregar gráficos
      try {
        // Gráfico de ventas por día
        const salesChartImage = await captureChart("sales-chart");
        if (salesChartImage) {
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 30;
          }

          doc.setFontSize(14);
          doc.text("Ventas por Día", 20, yPosition);
          yPosition += 10;

          doc.addImage(salesChartImage, "PNG", 20, yPosition, 170, 100);
          yPosition += 110;
        }

        // Gráfico de categorías
        const categoryChartImage = await captureChart("category-chart");
        if (categoryChartImage) {
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 30;
          }

          doc.setFontSize(14);
          doc.text("Ventas por Categoría", 20, yPosition);
          yPosition += 10;

          doc.addImage(categoryChartImage, "PNG", 20, yPosition, 170, 100);
          yPosition += 110;
        }
      } catch (error) {
        console.warn("Error adding charts to PDF:", error);
      }

      // Top Products
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(16);
      doc.text("Productos Más Vendidos", 20, yPosition);
      yPosition += 10;

      const productData = [
        ["Producto", "Cantidad Vendida", "Ingresos"],
        ...reportData.topProducts
          .slice(0, 10)
          .map((product) => [
            product.name,
            product.sold.toString(),
            `$${product.revenue.toLocaleString("es-ES")}`,
          ]),
      ];

      doc.autoTable({
        startY: yPosition,
        head: [productData[0]],
        body: productData.slice(1),
        theme: "striped",
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Low Stock Products
      if (reportData.lowStockProducts.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(16);
        doc.text("Productos con Stock Bajo", 20, yPosition);
        yPosition += 10;

        const stockData = [
          ["Producto", "Stock Actual", "Stock Mínimo"],
          ...reportData.lowStockProducts.map((product) => [
            product.name,
            product.stock.toString(),
            product.minStock.toString(),
          ]),
        ];

        doc.autoTable({
          startY: yPosition,
          head: [stockData[0]],
          body: stockData.slice(1),
          theme: "striped",
          margin: { left: 20, right: 20 },
        });
      }

      // Sales by Day
      if (reportData.salesByDay.length > 0) {
        doc.addPage();
        yPosition = 30;

        doc.setFontSize(16);
        doc.text("Ventas por Día", 20, yPosition);
        yPosition += 10;

        const salesData = [
          ["Día", "Ventas", "Ingresos"],
          ...reportData.salesByDay.map((day) => [
            day.day,
            day.sales.toString(),
            `$${day.revenue.toLocaleString("es-ES")}`,
          ]),
        ];

        doc.autoTable({
          startY: yPosition,
          head: [salesData[0]],
          body: salesData.slice(1),
          theme: "striped",
          margin: { left: 20, right: 20 },
        });
      }

      // Save the PDF
      doc.save(
        `reporte-ventas-${period}-${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Error al generar el PDF");
    }
  };

  const exportToExcel = (reportData: ReportData, period: string) => {
    try {
      const workbook = XLSX.utils.book_new();

      // KPIs Sheet
      const totalRevenue = reportData.salesByDay.reduce(
        (sum, day) => sum + day.revenue,
        0
      );
      const totalSales = reportData.salesByDay.reduce(
        (sum, day) => sum + day.sales,
        0
      );

      const kpiData = [
        ["Métrica", "Valor"],
        ["Período", getPeriodLabel(period)],
        ["Fecha de Generación", new Date().toLocaleDateString("es-ES")],
        ["Ingresos Totales", totalRevenue],
        ["Ventas Realizadas", totalSales],
        ["Total Clientes", reportData.customerStats.totalCustomers],
        ["Clientes Mayoristas", reportData.customerStats.wholesaleCustomers],
        ["Clientes Minoristas", reportData.customerStats.retailCustomers],
        ["Productos con Stock Bajo", reportData.lowStockProducts.length],
      ];

      const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(workbook, kpiSheet, "Resumen");

      // Sales by Day Sheet
      if (reportData.salesByDay.length > 0) {
        const salesData = [
          ["Día", "Ventas", "Ingresos"],
          ...reportData.salesByDay.map((day) => [
            day.day,
            day.sales,
            day.revenue,
          ]),
        ];
        const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
        XLSX.utils.book_append_sheet(workbook, salesSheet, "Ventas por Día");
      }

      // Top Products Sheet
      if (reportData.topProducts.length > 0) {
        const productData = [
          ["Producto", "Cantidad Vendida", "Ingresos"],
          ...reportData.topProducts.map((product) => [
            product.name,
            product.sold,
            product.revenue,
          ]),
        ];
        const productSheet = XLSX.utils.aoa_to_sheet(productData);
        XLSX.utils.book_append_sheet(workbook, productSheet, "Productos Top");
      }

      // Low Stock Sheet
      if (reportData.lowStockProducts.length > 0) {
        const stockData = [
          ["Producto", "Stock Actual", "Stock Mínimo"],
          ...reportData.lowStockProducts.map((product) => [
            product.name,
            product.stock,
            product.minStock,
          ]),
        ];
        const stockSheet = XLSX.utils.aoa_to_sheet(stockData);
        XLSX.utils.book_append_sheet(workbook, stockSheet, "Stock Bajo");
      }

      // Sales by Category Sheet
      if (reportData.salesByCategory.length > 0) {
        const categoryData = [
          ["Categoría", "Ventas"],
          ...reportData.salesByCategory.map((category) => [
            category.name,
            category.value,
          ]),
        ];
        const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(
          workbook,
          categorySheet,
          "Ventas por Categoría"
        );
      }

      // Save the Excel file
      XLSX.writeFile(
        workbook,
        `reporte-ventas-${period}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );
    } catch (error) {
      console.error("Error generating Excel:", error);
      throw new Error("Error al generar el archivo Excel");
    }
  };

  const exportToCSV = (reportData: ReportData, period: string) => {
    try {
      // Prepare comprehensive CSV data
      const csvData = [];

      // Header
      csvData.push(["REPORTE DE VENTAS Y ANALYTICS"]);
      csvData.push([`Período: ${getPeriodLabel(period)}`]);
      csvData.push([`Fecha: ${new Date().toLocaleDateString("es-ES")}`]);
      csvData.push([""]);

      // KPIs
      csvData.push(["RESUMEN EJECUTIVO"]);
      const totalRevenue = reportData.salesByDay.reduce(
        (sum, day) => sum + day.revenue,
        0
      );
      const totalSales = reportData.salesByDay.reduce(
        (sum, day) => sum + day.sales,
        0
      );

      csvData.push(["Ingresos Totales", totalRevenue]);
      csvData.push(["Ventas Realizadas", totalSales]);
      csvData.push(["Total Clientes", reportData.customerStats.totalCustomers]);
      csvData.push([
        "Productos con Stock Bajo",
        reportData.lowStockProducts.length,
      ]);
      csvData.push([""]);

      // Sales by Day
      if (reportData.salesByDay.length > 0) {
        csvData.push(["VENTAS POR DÍA"]);
        csvData.push(["Día", "Ventas", "Ingresos"]);
        reportData.salesByDay.forEach((day) => {
          csvData.push([day.day, day.sales, day.revenue]);
        });
        csvData.push([""]);
      }

      // Top Products
      if (reportData.topProducts.length > 0) {
        csvData.push(["PRODUCTOS MÁS VENDIDOS"]);
        csvData.push(["Producto", "Cantidad Vendida", "Ingresos"]);
        reportData.topProducts.forEach((product) => {
          csvData.push([product.name, product.sold, product.revenue]);
        });
        csvData.push([""]);
      }

      // Convert to CSV string
      const csvContent = csvData.map((row) => row.join(",")).join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `reporte-ventas-${period}-${
            new Date().toISOString().split("T")[0]
          }.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error generating CSV:", error);
      throw new Error("Error al generar el archivo CSV");
    }
  };

  const exportChartsAsPDF = async (elementId: string, filename: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Elemento no encontrado");
      }

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();

      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 20;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
    } catch (error) {
      console.error("Error exporting charts:", error);
      throw new Error("Error al exportar los gráficos");
    }
  };

  return {
    exportToPDF,
    exportToExcel,
    exportToCSV,
    exportChartsAsPDF,
  };
};

const getPeriodLabel = (period: string): string => {
  switch (period) {
    case "7days":
      return "Últimos 7 días";
    case "30days":
      return "Últimos 30 días";
    case "90days":
      return "Últimos 90 días";
    case "1year":
      return "Último año";
    default:
      return period;
  }
};
