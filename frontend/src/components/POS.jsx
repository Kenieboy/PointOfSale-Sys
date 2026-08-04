import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import VoidAuthModal from "./VoidAuthModal";

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

const POS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [saleResult, setSaleResult] = useState(null);
  const [processingSale, setProcessingSale] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidItemIndex, setVoidItemIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { getAuthHeaders, user } = useAuth();
  const { getSetting } = useSettings();
  const receiptRef = useRef();
  const searchInputRef = useRef();
  const cashInputRef = useRef();

  const taxRate = getSetting("tax_rate", 0);
  const enableTax = getSetting("enable_tax", false);
  const currencySymbol = getSetting("currency_symbol", "$");
  const storeName = getSetting("store_name", "POS SYSTEM");
  const storeAddress = getSetting("store_address", "");
  const storePhone = getSetting("store_phone", "");
  const receiptHeader = getSetting("receipt_header", "Thank you for shopping!");
  const receiptFooter = getSetting("receipt_footer", "Please come again!");
  const showChangeBreakdown = getSetting("receipt_show_change_breakdown", true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "F2") {
        if (!showCheckoutModal && cart.length > 0) {
          e.preventDefault();
          openCheckout();
        }
        return;
      }
      if (e.key === "F9") {
        if (showCheckoutModal && !saleResult && !processingSale) {
          e.preventDefault();
          handleCompleteSale();
        }
        return;
      }
      if (e.key === "F10") {
        if (saleResult) {
          e.preventDefault();
          handlePrint();
        }
        return;
      }
      if (e.key === "Escape") {
        if (showCheckoutModal) {
          e.preventDefault();
          closeCheckout();
        }
        return;
      }
      if (e.key === "?" && !showCheckoutModal && !showVoidModal) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    showCheckoutModal,
    saleResult,
    processingSale,
    cart.length,
    showVoidModal,
  ]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products", getAuthHeaders());
      const parsed = response.data.map((p) => ({
        ...p,
        price: parseFloat(p.price) || 0,
      }));
      setProducts(parsed);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item,
        );
      } else {
        const price = parseFloat(product.price) || 0;
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: price,
            quantity: 1,
            total: price,
          },
        ];
      }
    });
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;

    const term = searchTerm.trim();
    if (!term) return;

    const byBarcode = products.find((p) => p.barcode && p.barcode === term);
    if (byBarcode) {
      addToCart(byBarcode);
      setSearchTerm("");
      setMessage(`Added: ${byBarcode.name}`);
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    const byPartialBarcode = products.find(
      (p) => p.barcode && p.barcode.includes(term),
    );
    if (byPartialBarcode) {
      addToCart(byPartialBarcode);
      setSearchTerm("");
      setMessage(`Added: ${byPartialBarcode.name}`);
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    const byName = products.find(
      (p) => p.name.toLowerCase() === term.toLowerCase(),
    );
    if (byName) {
      addToCart(byName);
      setSearchTerm("");
      setMessage(`Added: ${byName.name}`);
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    setMessage("Product not found");
    setTimeout(() => setMessage(""), 2000);
  };

  const removeFromCart = (index) => {
    setVoidItemIndex(index);
    setShowVoidModal(true);
  };

  const handleVoidConfirm = async (reason, adminId) => {
    const item = cart[voidItemIndex];
    if (item.saleItemId) {
      try {
        await axios.post(
          "/api/sales/void-item",
          {
            saleItemId: item.saleItemId,
            reason,
            adminId,
          },
          getAuthHeaders(),
        );
        setMessage("Item voided successfully");
      } catch (error) {
        setMessage("Error voiding item");
      }
    }
    setCart((prev) => prev.filter((_, i) => i !== voidItemIndex));
    setVoidItemIndex(null);
  };

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    setCart((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: newQty, total: newQty * item.price }
          : item,
      ),
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + (parseFloat(item.total) || 0),
    0,
  );
  const taxAmount = enableTax ? subtotal * (parseFloat(taxRate) / 100) : 0;
  const totalAmount = subtotal + taxAmount;

  const change =
    paymentMethod === "cash" && cashReceived
      ? Math.max(0, parseFloat(cashReceived) - totalAmount)
      : 0;
  const changeBreakdown = change > 0 ? getChangeBreakdown(change) : [];

  const openCheckout = useCallback(() => {
    if (cart.length === 0) {
      setMessage("Cart is empty");
      return;
    }
    setCashReceived(totalAmount.toFixed(2));
    setSaleResult(null);
    setShowCheckoutModal(true);
  }, [cart.length, totalAmount]);

  const handleCompleteSale = useCallback(async () => {
    if (paymentMethod === "cash" && parseFloat(cashReceived) < totalAmount) {
      setMessage("Insufficient cash received");
      return;
    }

    setProcessingSale(true);
    try {
      const response = await axios.post(
        "/api/sales",
        {
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price) || 0,
          })),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          paymentMethod,
          cashReceived:
            paymentMethod === "cash" ? parseFloat(cashReceived) || 0 : null,
          changeAmount: paymentMethod === "cash" ? change : null,
        },
        getAuthHeaders(),
      );

      const result = {
        saleId: response.data.saleId,
        items: [...cart],
        subtotal: subtotal,
        tax: taxAmount,
        total: totalAmount,
        cashReceived: parseFloat(cashReceived) || 0,
        change: change,
        changeBreakdown: changeBreakdown,
        paymentMethod,
        cashier: user?.name || "Cashier",
        date: new Date().toLocaleString(),
      };

      setSaleResult(result);
      setCart([]);
      setMessage("");
    } catch (error) {
      setMessage("Error processing sale");
    } finally {
      setProcessingSale(false);
    }
  }, [
    cart,
    subtotal,
    taxAmount,
    totalAmount,
    cashReceived,
    change,
    changeBreakdown,
    paymentMethod,
    user,
    getAuthHeaders,
  ]);

  // Direct print — no preview window, straight to system print dialog
  const handlePrint = useCallback(() => {
    const receiptHTML = receiptRef.current.innerHTML;

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
          <title>Receipt #${saleResult?.saleId}</title>
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
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .bold { font-weight: bold; }
            .total {
              font-size: 15px;
              font-weight: bold;
              margin-top: 6px;
            }
            .change-box {
              border: 1px solid #000;
              padding: 6px;
              margin-top: 6px;
            }
            .denom-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${receiptHTML}
          </div>
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
  }, [saleResult]);

  const closeCheckout = useCallback(() => {
    setShowCheckoutModal(false);
    setSaleResult(null);
    setCashReceived("");
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const handleCashInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCompleteSale();
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Shortcut Help Panel */}
      {showShortcuts && (
        <div className="fixed bottom-6 left-6 z-40 card p-4 shadow-lg border border-gray-200 max-w-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-gray-900">
              ⌨️ Keyboard Shortcuts
            </h3>
            <button
              onClick={() => setShowShortcuts(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Scan / Search</span>{" "}
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                Enter
              </kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Open Checkout</span>{" "}
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                F2
              </kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Complete Sale</span>{" "}
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                F9
              </kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Print Receipt</span>{" "}
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                F10
              </kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Close Modal</span>{" "}
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                Esc
              </kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Toggle Help</span>{" "}
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                ?
              </kbd>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
        {/* Products Section */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products or scan barcode + Enter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="input-field pl-11 pr-10"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <span className="text-4xl mb-2">📦</span>
                <p>No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="card p-4 text-left hover:shadow-md hover:border-primary-300 transition-all duration-200 group"
                  >
                    <div className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full inline-block mb-2">
                      {product.category}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-primary-700 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-lg font-bold text-primary-600">
                      {currencySymbol}
                      {formatPrice(product.price)}
                    </p>
                    {product.barcode && (
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">
                        {product.barcode}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="card flex flex-col h-full">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🛍️ Current Order
              {cart.length > 0 && (
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <span className="text-3xl mb-2">🛒</span>
                <p className="text-sm">Scan barcode or click a product</p>
                <p className="text-xs text-gray-300 mt-1">
                  Press <kbd className="bg-gray-100 px-1 rounded">?</kbd> for
                  shortcuts
                </p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {item.name}
                    </span>
                    <span className="text-primary-600 font-bold text-sm">
                      {currencySymbol}
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">
                        {currencySymbol}
                        {formatPrice(item.total)}
                      </span>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Void item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-field text-sm"
              >
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="digital">📱 Digital Wallet</option>
              </select>
            </div>

            <div className="space-y-1 py-2 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {currencySymbol}
                  {formatPrice(subtotal)}
                </span>
              </div>
              {enableTax && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({taxRate}%)</span>
                  <span className="font-medium text-gray-900">
                    {currencySymbol}
                    {formatPrice(taxAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-900 font-bold">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  {currencySymbol}
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            <button
              onClick={openCheckout}
              disabled={cart.length === 0}
              className="btn-primary w-full py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Checkout</span>
              <kbd className="hidden sm:inline-block bg-primary-700 text-primary-100 text-xs px-1.5 py-0.5 rounded font-mono">
                F2
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg cursor-pointer animate-slideIn z-50 ${
            message.includes("❌") ||
            message.includes("Error") ||
            message.includes("Insufficient")
              ? "bg-red-500"
              : "bg-green-500"
          } text-white`}
          onClick={() => setMessage("")}
        >
          <div className="flex items-center gap-2">
            <span>
              {message.includes("❌") || message.includes("Error")
                ? "⚠️"
                : "✅"}
            </span>
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            {!saleResult ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    💳 Checkout
                  </h2>
                  <kbd className="hidden sm:inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-mono">
                    F9 = Complete
                  </kbd>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Order Summary
                  </h3>
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">
                        {currencySymbol}
                        {formatPrice(item.total)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>
                        {currencySymbol}
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {enableTax && (
                      <div className="flex justify-between text-sm">
                        <span>Tax ({taxRate}%)</span>
                        <span>
                          {currencySymbol}
                          {formatPrice(taxAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-primary-600 text-lg">
                        {currencySymbol}
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {paymentMethod === "cash" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Cash Received
                    </label>
                    <input
                      ref={cashInputRef}
                      type="number"
                      step="0.01"
                      min={totalAmount}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={handleCashInputKeyDown}
                      className="input-field text-lg font-bold"
                      placeholder="0.00"
                      autoFocus
                    />
                    {change > 0 && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium mb-2">
                          Change: {currencySymbol}
                          {formatPrice(change)}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs text-green-600 font-semibold uppercase">
                            Denomination Breakdown:
                          </p>
                          {changeBreakdown.map((d, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-sm text-green-700"
                            >
                              <span>
                                {d.value >= 1
                                  ? `${currencySymbol}${d.value} bill`
                                  : `${(d.value * 100).toFixed(0)}¢ coin`}
                              </span>
                              <span className="font-bold">x{d.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {parseFloat(cashReceived) > 0 &&
                      parseFloat(cashReceived) < totalAmount && (
                        <p className="mt-2 text-sm text-red-600">
                          Insufficient amount
                        </p>
                      )}
                  </div>
                )}

                {paymentMethod !== "cash" && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    💳 Customer will pay{" "}
                    <strong>
                      {currencySymbol}
                      {formatPrice(totalAmount)}
                    </strong>{" "}
                    via {paymentMethod}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeCheckout}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompleteSale}
                    disabled={
                      processingSale ||
                      (paymentMethod === "cash" &&
                        parseFloat(cashReceived) < totalAmount)
                    }
                    className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>
                      {processingSale ? "Processing..." : "Complete Sale"}
                    </span>
                    {!processingSale && (
                      <kbd className="hidden sm:inline-block bg-primary-700 text-primary-100 text-xs px-1.5 py-0.5 rounded font-mono">
                        F9
                      </kbd>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🧾</div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Sale Complete!
                  </h2>
                  <p className="text-sm text-gray-500">
                    Receipt #{saleResult.saleId}
                  </p>
                </div>

                <div
                  ref={receiptRef}
                  className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-5 mb-4"
                >
                  <div className="text-center mb-3">
                    <h3 className="font-bold text-lg">{storeName}</h3>
                    {storeAddress && (
                      <p className="text-xs text-gray-500">{storeAddress}</p>
                    )}
                    {storePhone && (
                      <p className="text-xs text-gray-500">{storePhone}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {saleResult.date}
                    </p>
                    <p className="text-xs text-gray-500">
                      Receipt: #{saleResult.saleId}
                    </p>
                  </div>

                  {receiptHeader && (
                    <div className="text-center text-xs text-gray-500 mb-2 italic">
                      {receiptHeader}
                    </div>
                  )}

                  <div className="border-t border-b border-gray-300 py-2 my-2 space-y-1">
                    {saleResult.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono">
                          {currencySymbol}
                          {formatPrice(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">
                        {currencySymbol}
                        {formatPrice(saleResult.subtotal)}
                      </span>
                    </div>
                    {enableTax && (
                      <div className="flex justify-between">
                        <span>Tax ({taxRate}%)</span>
                        <span className="font-mono">
                          {currencySymbol}
                          {formatPrice(saleResult.tax)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2">
                      <span>TOTAL</span>
                      <span className="font-mono">
                        {currencySymbol}
                        {formatPrice(saleResult.total)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment</span>
                      <span className="capitalize">
                        {saleResult.paymentMethod}
                      </span>
                    </div>
                    {saleResult.paymentMethod === "cash" && (
                      <>
                        <div className="flex justify-between">
                          <span>Cash Received</span>
                          <span className="font-mono">
                            {currencySymbol}
                            {formatPrice(saleResult.cashReceived)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-green-700">
                          <span>CHANGE</span>
                          <span className="font-mono">
                            {currencySymbol}
                            {formatPrice(saleResult.change)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {saleResult.change > 0 && showChangeBreakdown && (
                    <div className="mt-3 pt-2 border-t border-gray-300">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        CHANGE BREAKDOWN
                      </p>
                      {saleResult.changeBreakdown.map((d, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span>
                            {d.value >= 1
                              ? `${currencySymbol}${d.value} bill`
                              : `${(d.value * 100).toFixed(0)}¢ coin`}
                          </span>
                          <span>x{d.count}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-center mt-4 pt-3 border-t border-gray-300">
                    <p className="text-xs text-gray-500">
                      Cashier: {saleResult.cashier}
                    </p>
                    {receiptFooter && (
                      <p className="text-xs text-gray-400 mt-1">
                        {receiptFooter}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeCheckout}
                    className="btn-secondary flex-1"
                  >
                    New Order
                  </button>
                  <button
                    onClick={handlePrint}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <span>🖨️ Print Receipt</span>
                    <kbd className="hidden sm:inline-block bg-primary-700 text-primary-100 text-xs px-1.5 py-0.5 rounded font-mono">
                      F10
                    </kbd>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <VoidAuthModal
        isOpen={showVoidModal}
        onClose={() => {
          setShowVoidModal(false);
          setVoidItemIndex(null);
        }}
        onConfirm={handleVoidConfirm}
        itemName={voidItemIndex !== null ? cart[voidItemIndex]?.name : ""}
      />
    </div>
  );
};

export default POS;
