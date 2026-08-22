import { formatDate } from "./formatters";

export const getChartData = (responseData, isProducts) => {
  if (!responseData?.chartData || responseData.chartData.length === 0) return [];
  
  return responseData.chartData.map(item => ({
    date: formatDate(item.date),
    fullDate: item.date,
    name: isProducts ? (item.topProduct || "Unknown Product") : (item.topCategory || "Unknown Category"),
    quantity: item.totalQuantity || 0,
    revenue: item.totalSales || 0
  }));
};

export const getAggregatedData = (chartData = []) => {
  if (chartData.length === 0) return [];
  
  const aggregated = {};
  chartData.forEach(item => {
    const name = item.name;
    if (!aggregated[name]) {
      aggregated[name] = {
        name,
        revenue: 0,
        quantity: 0,
        days: 0
      };
    }
    aggregated[name].revenue += item.revenue;
    aggregated[name].quantity += item.quantity;
    aggregated[name].days += 1;
  });
  
  return Object.values(aggregated)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
};

export const getSortedTableData = (chartData = []) => {
  if (chartData.length === 0) return [];
  return [...chartData].sort((a, b) => b.revenue - a.revenue);
};
