import {
  getDailySummary,
  getDailyPaymentBreakdown,
  getDailyCategoryBreakdown,
  getDailyHourlyBreakdown,
  getMonthlySummary,
  getMonthlyDailyBreakdown,
  getMonthlyTopProducts,
  getMonthlyVoidedItems,
} from "../models/Report.js";

const getDailyReport = async (req, res) => {
  const { date } = req.query;
  const queryDate = date || new Date().toISOString().split("T")[0];

  try {
    const [summary, byPayment, byCategory, hourly] = await Promise.all([
      getDailySummary(queryDate),
      getDailyPaymentBreakdown(queryDate),
      getDailyCategoryBreakdown(queryDate),
      getDailyHourlyBreakdown(queryDate),
    ]);

    res.json({
      date: queryDate,
      summary,
      byPayment,
      byCategory,
      hourly,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMonthlyReport = async (req, res) => {
  const { year, month } = req.query;
  const queryYear = year || new Date().getFullYear();
  const queryMonth = month || new Date().getMonth() + 1;

  try {
    const [summary, dailyBreakdown, topProducts, voidedItems] =
      await Promise.all([
        getMonthlySummary(queryYear, queryMonth),
        getMonthlyDailyBreakdown(queryYear, queryMonth),
        getMonthlyTopProducts(queryYear, queryMonth),
        getMonthlyVoidedItems(queryYear, queryMonth),
      ]);

    res.json({
      year: queryYear,
      month: queryMonth,
      summary,
      dailyBreakdown,
      topProducts,
      voidedItems,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { getDailyReport, getMonthlyReport };
