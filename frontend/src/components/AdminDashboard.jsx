import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const [todaySales, setTodaySales] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageSale: 0,
  });
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchTodaySales();
  }, []);

  const fetchTodaySales = async () => {
    try {
      const response = await axios.get("/api/sales/today", getAuthHeaders());
      setTodaySales(response.data);

      const total = response.data.reduce(
        (sum, sale) => sum + parseFloat(sale.actual_total || sale.total_amount),
        0,
      );
      setStats({
        totalSales: total,
        totalTransactions: response.data.length,
        averageSale: response.data.length ? total / response.data.length : 0,
      });
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-2xl">
              💰
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Today
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Sales</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.totalSales)}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
              🧾
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Today
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Transactions</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalTransactions}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
              📊
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              Today
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Average Sale</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.averageSale)}
          </p>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Today's Transactions
          </h2>
          <span className="text-sm text-gray-500">
            {todaySales.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Receipt #
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Cashier
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Amount
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Payment
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todaySales.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    <span className="text-3xl block mb-2">📭</span>
                    No transactions today
                  </td>
                </tr>
              ) : (
                todaySales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-primary-600">
                      #{sale.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {sale.cashier_name}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-900">
                      {formatCurrency(sale.actual_total || sale.total_amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${
                          sale.payment_method === "cash"
                            ? "bg-green-100 text-green-800"
                            : sale.payment_method === "card"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
