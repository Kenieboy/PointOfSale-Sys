import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

const formatPrice = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const DENOMINATIONS = [
  1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25, 0.1, 0.05, 0.01,
];

const getChangeBreakdown = (changeAmount) => {
  let remaining = Math.round(changeAmount * 100);
  const breakdown = [];
  for (const denom of DENOMINATIONS) {
    const denomCents = Math.round(denom * 100);
    const count = Math.floor(remaining / denomCents);
    if (count > 0) {
      breakdown.push({ value: denom, count });
      remaining -= count * denomCents;
    }
  }
  return breakdown;
};

const ITEMS_PER_PAGE = 5;

const AdminDashboard = () => {
  const [todaySales, setTodaySales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageSale: 0,
  });
  const [message, setMessage] = useState("");
  const { getAuthHeaders } = useAuth();
  const { getSetting } = useSettings();

  const currencySymbol = getSetting("currency_symbol", "$");
  const storeName = getSetting("store_name", "POS SYSTEM");
  const storeAddress = getSetting("store_address", "");
  const storePhone = getSetting("store_phone", "");
  const receiptHeader = getSetting("receipt_header", "Thank you for shopping!");
  const receiptFooter = getSetting("receipt_footer", "Please come again!");
  const showChangeBreakdown = getSetting("receipt_show_change_breakdown", true);
  const enableTax = getSetting("enable_tax", false);
  const taxRate = getSetting("tax_rate", 0);

  useEffect(() => {
    fetchTodaySales();
  }, []);

  const fetchTodaySales = async () => {
    try {
      const response = await axios.get("/api/sales/today", getAuthHeaders());
      setTodaySales(response.data);
      setCurrentPage(1);

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

  // Pagination logic
  const totalPages = Math.ceil(todaySales.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedSales = todaySales.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleReprint = useCallback(
    async (saleId) => {
      try {
        const response = await axios.get(
          `/api/sales/${saleId}`,
          getAuthHeaders(),
        );
        const sale = response.data;

        if (!sale || !sale.items) {
          setMessage("❌ Could not load receipt data");
          setTimeout(() => setMessage(""), 3000);
          return;
        }

        const itemsHTML = sale.items
          .map(
            (item) => `
        <div class="row">
          <span>${item.quantity}x ${item.product_name}</span>
          <span class="font-mono">${currencySymbol}${formatPrice(item.total_price)}</span>
        </div>
      `,
          )
          .join("");

        const subtotal = parseFloat(sale.total_amount) || 0;
        const taxAmount = enableTax
          ? subtotal * (parseFloat(taxRate) / 100)
          : 0;
        const total = subtotal + taxAmount;
        const cashReceived = parseFloat(sale.cash_received) || 0;
        const change = parseFloat(sale.change_amount) || 0;
        const changeBreakdown = change > 0 ? getChangeBreakdown(change) : [];

        const receiptHTML = `
        <div class="text-center mb-3">
          <h3 class="font-bold text-lg">${storeName}</h3>
          ${storeAddress ? `<p class="text-xs text-gray-500">${storeAddress}</p>` : ""}
          ${storePhone ? `<p class="text-xs text-gray-500">${storePhone}</p>` : ""}
          <p class="text-xs text-gray-500 mt-1">${new Date(sale.created_at).toLocaleString()}</p>
          <p class="text-xs text-gray-500">Receipt: #${sale.id} (REPRINT)</p>
        </div>

        ${receiptHeader ? `<div class="center text-xs text-gray-500 mb-2 italic">${receiptHeader}</div>` : ""}

        <div class="divider"></div>
        <div class="space-y-1">
          ${itemsHTML}
        </div>
        <div class="divider"></div>

        <div class="space-y-1 text-sm">
          <div class="row">
            <span>Subtotal</span>
            <span class="font-mono">${currencySymbol}${formatPrice(subtotal)}</span>
          </div>
          ${
            enableTax
              ? `
            <div class="row">
              <span>Tax (${taxRate}%)</span>
              <span class="font-mono">${currencySymbol}${formatPrice(taxAmount)}</span>
            </div>
          `
              : ""
          }
          <div class="row bold total">
            <span>TOTAL</span>
            <span class="font-mono">${currencySymbol}${formatPrice(total)}</span>
          </div>
          <div class="row">
            <span>Payment</span>
            <span class="capitalize">${sale.payment_method}</span>
          </div>
          ${
            sale.payment_method === "cash" && cashReceived > 0
              ? `
            <div class="row">
              <span>Cash Received</span>
              <span class="font-mono">${currencySymbol}${formatPrice(cashReceived)}</span>
            </div>
            <div class="row bold" style="color: #15803d;">
              <span>CHANGE</span>
              <span class="font-mono">${currencySymbol}${formatPrice(change)}</span>
            </div>
          `
              : ""
          }
        </div>

        ${
          change > 0 && showChangeBreakdown
            ? `
          <div class="divider"></div>
          <p class="text-xs font-semibold text-gray-500 mb-1">CHANGE BREAKDOWN</p>
          ${changeBreakdown
            .map(
              (d) => `
            <div class="denom-row">
              <span>${d.value >= 1 ? `${currencySymbol}${d.value} bill` : `${(d.value * 100).toFixed(0)}¢ coin`}</span>
              <span>x${d.count}</span>
            </div>
          `,
            )
            .join("")}
        `
            : ""
        }

        <div class="divider"></div>
        <div class="text-center mt-3">
          <p class="text-xs text-gray-500">Cashier: ${sale.cashier_name}</p>
          ${receiptFooter ? `<p class="text-xs text-gray-400 mt-1">${receiptFooter}</p>` : ""}
          <p class="text-[10px] text-gray-400 mt-2">*** REPRINT ***</p>
        </div>
      `;

        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt #${sale.id}</title>
            <style>
              @page { margin: 0; size: 80mm auto; }
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 13px;
                margin: 0;
                padding: 8px;
                color: #000;
                width: 80mm;
              }
              .receipt { width: 100%; }
              .center { text-align: center; }
              .divider { border-top: 1px dashed #000; margin: 6px 0; }
              .row { display: flex; justify-content: space-between; margin: 3px 0; }
              .bold { font-weight: bold; }
              .total { font-size: 15px; font-weight: bold; margin-top: 6px; }
              .denom-row { display: flex; justify-content: space-between; font-size: 11px; }
              .font-mono { font-family: 'Courier New', monospace; }
            </style>
          </head>
          <body>
            <div class="receipt">${receiptHTML}</div>
          </body>
        </html>
      `);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }, 100);

        setMessage("🖨️ Receipt sent to printer");
        setTimeout(() => setMessage(""), 3000);
      } catch (error) {
        setMessage("❌ Failed to load receipt");
        setTimeout(() => setMessage(""), 3000);
      }
    },
    [
      getAuthHeaders,
      currencySymbol,
      storeName,
      storeAddress,
      storePhone,
      receiptHeader,
      receiptFooter,
      showChangeBreakdown,
      enableTax,
      taxRate,
    ],
  );

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

      {/* Paginated Transactions Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Today's Transactions
          </h2>
          <span className="text-sm text-gray-500">
            {todaySales.length > 0
              ? `Page ${currentPage} of ${totalPages}`
              : "No records"}
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
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todaySales.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    <span className="text-3xl block mb-2">📭</span>
                    No transactions today
                  </td>
                </tr>
              ) : (
                displayedSales.map((sale, index) => (
                  <tr
                    key={sale.id}
                    className={`transition-colors ${
                      index % 2 === 0
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
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
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleReprint(sale.id)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                        title="Reprint receipt"
                      >
                        🖨️ Reprint
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {todaySales.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Showing <span className="font-semibold">{startIndex + 1}</span>–
              <span className="font-semibold">
                {Math.min(startIndex + ITEMS_PER_PAGE, todaySales.length)}
              </span>{" "}
              of <span className="font-semibold">{todaySales.length}</span>{" "}
              transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600 font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg cursor-pointer animate-slideIn z-50 ${
            message.includes("❌") ? "bg-red-500" : "bg-green-500"
          } text-white`}
          onClick={() => setMessage("")}
        >
          <div className="flex items-center gap-2">
            <span>{message.includes("❌") ? "⚠️" : "✅"}</span>
            <span className="font-medium">
              {message.replace(/✅|❌|🖨️/g, "").trim()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
