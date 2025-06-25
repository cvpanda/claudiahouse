import { Download, FileText, FileSpreadsheet } from "lucide-react";

interface ExportMenuProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  disabled?: boolean;
}

export default function ExportMenu({
  onExportPDF,
  onExportExcel,
  onExportCSV,
  disabled = false,
}: ExportMenuProps) {
  return (
    <div className="relative inline-block text-left">
      <div className="group">
        {" "}
        <button
          type="button"
          disabled={disabled}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            disabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </button>
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="py-1" role="menu">
            <button
              onClick={onExportPDF}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              <FileText className="h-4 w-4 mr-3 text-red-500" />
              Exportar como PDF
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              <FileSpreadsheet className="h-4 w-4 mr-3 text-green-500" />
              Exportar como Excel
            </button>

            <button
              onClick={onExportCSV}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              <FileSpreadsheet className="h-4 w-4 mr-3 text-blue-500" />
              Exportar como CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
