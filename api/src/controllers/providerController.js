import * as providerCalendarService from "../services/providerCalendar.js";

/**
 * Get provider calendar with events
 * GET /api/providers/:providerId/calendar?month=YYYY-MM
 */
export async function getProviderCalendar(req, res) {
  try {
    const { providerId } = req.params;
    const { month } = req.query;

    // Validar parámetros
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: "Month parameter is required in format YYYY-MM",
      });
    }

    const calendarData = await providerCalendarService.getProviderCalendar(
      parseInt(providerId),
      month
    );

    res.json({
      success: true,
      data: calendarData,
    });
  } catch (error) {
    console.error("Error in getProviderCalendar controller:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get provider calendar",
    });
  }
}
