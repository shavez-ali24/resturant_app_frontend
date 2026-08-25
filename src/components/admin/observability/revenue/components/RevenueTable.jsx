import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableIcon } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

export const RevenueTable = ({
  tableData = [],
  fromDate,
  toDate,
  timeRange,
  colors,
  isDarkMode,
  isLoading,
}) => {
  const tableHeaderBg = isDarkMode ? "bg-slate-800" : "bg-[#f7f3ef]";
  const tableRowHover = isDarkMode ? "hover:bg-slate-800/60" : "hover:bg-[#faf7f4]";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-[#78716c]";

  const totalRevenue = tableData.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <div className={`overflow-hidden rounded-xl border ${isDarkMode ? "border-slate-700" : "border-[#ede8e3]"}`}>
      <Table containerClassName="max-h-[540px] overflow-x-auto overflow-y-auto">
        <TableHeader className={`sticky top-0 z-10 ${tableHeaderBg}`}>
          <TableRow>
            <TableHead className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Date</TableHead>
            <TableHead className={`font-semibold text-right ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Orders</TableHead>
            <TableHead className={`font-semibold text-right ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-3" style={{ borderBottomColor: colors.primary }}></div>
                  <p className={`text-sm font-medium ${textSecondary}`}>Loading table data...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : tableData.length > 0 ? (
            tableData.map((row, index) => (
              <TableRow
                key={`${row.displayDate}-${index}`}
                className={`border-b transition-colors ${
                  isDarkMode ? "border-slate-700 hover:bg-slate-800/60" : "border-[#f0ebe5] hover:bg-[#faf7f4]"
                }`}
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors.primary }}></div>
                    <span className={`font-medium ${textPrimary}`}>{row.displayDate}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-3">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                    style={{
                      backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                      color: isDarkMode ? colors.primary : colors.primaryText,
                    }}
                  >
                    {row.orders}
                  </span>
                </TableCell>
                <TableCell className="text-right py-3">
                  <span className="font-bold" style={{ color: colors.primary }}>
                    {formatCurrency(row.revenue)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                    }}
                  >
                    <TableIcon className="h-5 w-5" style={{ color: colors.primary }} />
                  </div>
                  <p className={`mb-2 font-bold ${textPrimary}`}>No Data Available</p>
                  <p className={`max-w-md text-sm ${textSecondary}`}>
                    {timeRange === "custom" && fromDate && toDate
                      ? `No revenue records found between ${new Date(fromDate).toLocaleDateString()} and ${new Date(toDate).toLocaleDateString()}`
                      : "No revenue records found for the selected time period"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Table Footer */}
      {tableData.length > 0 && (
        <div className={`border-t px-4 py-3 ${isDarkMode ? "border-slate-700 bg-slate-800/60" : "border-[#ede8e3] bg-[#f7f3ef]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className={`text-sm ${textSecondary}`}>
              Showing <span className="font-bold" style={{ color: colors.primary }}>{tableData.length}</span> records
              {timeRange === "custom" && fromDate && toDate && (
                <span className="ml-2 text-xs">
                  ({new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-[#78716c]"}`}>Total Revenue:</span>
              <span className="text-lg font-bold" style={{ color: colors.primary }}>
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
