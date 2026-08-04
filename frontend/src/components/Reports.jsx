import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Reports = () => {
  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const generateReport = async () => {
    setLoading(true);
    try {
      const endpoint =
        reportType === "daily"
          ? `/api/reports/daily?date=${date}`
          : `/api/reports/monthly?year=${year}&month=${month}`;

      const response = await axios.get(endpoint, getAuthHeaders());
      setReportData(response.data);
    } catch (error) {
      console.error("Error generating report:", error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>

      {/* Controls */}
      <div className="card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field w-full sm:w-40"
            >
              <option value="daily">Daily Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          {reportType === "daily" ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input-field w-28"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="input-field w-40"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "⏳ Generating..." : "📊 Generate Report"}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.summary?.total_transactions || 0}
                </p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <p className="text-xs text-primary-600 uppercase tracking-wider mb-1">
                  Total Sales
                </p>
                <p className="text-2xl font-bold text-primary-700">
                  {formatCurrency(reportData.summary?.total_sales)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Items Sold
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.summary?.total_items || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Average Sale
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.summary?.average_sale)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            {reportData.byPayment && reportData.byPayment.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">By Payment Method</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                        Method
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                        Count
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.byPayment.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm capitalize">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              p.payment_method === "cash"
                                ? "bg-green-100 text-green-800"
                                : p.payment_method === "card"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {p.payment_method === "cash" && "💵"}
                            {p.payment_method === "card" && "💳"}
                            {p.payment_method === "digital" && "📱"}
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-900">
                          {p.count}
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(p.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top Products */}
            {reportData.topProducts && reportData.topProducts.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Top Products</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                        Product
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                        Qty
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.topProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-900">
                          <span className="font-medium">{p.name}</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-900 text-right">
                          {p.quantity_sold}
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-primary-600 text-right">
                          {formatCurrency(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Daily Breakdown */}
          {reportData.dailyBreakdown &&
            reportData.dailyBreakdown.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Daily Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                          Date
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                          Transactions
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                          Sales
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">
                          Items
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.dailyBreakdown.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm text-gray-900">
                            {new Date(d.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-900 text-right">
                            {d.transactions}
                          </td>
                          <td className="px-5 py-3 text-sm font-bold text-gray-900 text-right">
                            {formatCurrency(d.sales)}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-900 text-right">
                            {d.items}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Reports;
