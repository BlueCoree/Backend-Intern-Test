const influxdbService = require('../services/influxdb.service');

class EnergyController {
  async getRealtimeData(req, res, next) {
    try {
      const panels = await influxdbService.getDashboardData();

      if (!panels || panels.length === 0) {
        const error = new Error("Gagal terhubung ke Database");
        error.name = "DatabaseError";
        throw error;
      }

      const formattedData = panels.map(panel => {
        if (panel.status === 'ONLINE') {
          return {
            pmCode: panel.pmCode,
            status: 'ONLINE',
            realtime: {
              voltage: panel.v_0,
              current: panel.i_1,
              power: panel.kW,
              energy: panel.kWh
            },
            todayUsage: panel.todayUsage,
            cost: (panel.todayUsage * 1500).toLocaleString('id-ID'),
            lastUpdate: panel.time
          };
        }

        return {
          pmCode: panel.pmCode,
          status: 'OFFLINE',
          message: 'No data received in the last 5 minutes'
        };
      });

      res.json({
        status: 'Success',
        data: formattedData
      });
    } catch (error) {
      next(error);
    }
  }

  async getTodayUsage(req, res, next) {
    try {
      const { panel } = req.params;

      const usage = await influxdbService.getTodayUsage(panel);

      if (!usage) {
        const error = new Error(`Panel ${panel} tidak ditemukan atau tidak ada data`);
        error.name = "NotFound";
        throw error;
      }

      res.json({
        panel: panel,
        usage_kwh: parseFloat(usage.todayUsage),
        total_cost: Math.round(usage.todayUsage * 1500),
        last_update: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async getYearlyStats(req, res, next) {
    try {
      const year = req.query.year || new Date().getFullYear();

      // Validasi year
      if (isNaN(year) || year < 2000 || year > 2100) {
        const error = new Error("Format tahun tidak valid");
        error.name = "BadRequest";
        throw error;
      }

      const stats = await influxdbService.getTotalEnergyUsage(parseInt(year));

      if (!stats) {
        const error = new Error("Gagal terhubung ke Database");
        error.name = "DatabaseError";
        throw error;
      }

      res.json({
        status: 'Success',
        data: {
          year: year,
          monthly_stats: stats
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnergyController();