export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)

export const formatCompactNumber = (number) => {
  if (number >= 10000000) return `₹${(number / 10000000).toFixed(2)}Cr`
  if (number >= 100000) return `₹${(number / 100000).toFixed(1)}L`
  if (number >= 1000) return `₹${(number / 1000).toFixed(1)}k`
  return `₹${number}`
}

export const getBackendDateParts = (value) => {
  const raw = String(value || "").trim()
  if (!raw) return { raw: "", date: "", time: "" }
  const [datePart, timePart] = raw.split(" ")
  return {
    raw,
    date: datePart || raw,
    time: timePart || "",
  }
}

export const formatChartDate = (dateString, range) => {
  const { raw, date, time } = getBackendDateParts(dateString)
  if (!raw) return ""
  if (range === "1d") return time || raw
  return date || raw
}

export const formatTableDate = (dateString, range) => {
  return getBackendDateParts(dateString).raw
}

export const formatFullDate = (dateStr) => {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export const formatDateInput = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}
