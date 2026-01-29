const influxdbService = require('../services/influxdb.service');

class EnergyController {
    async getRealtimeData(req, res) {
    try {
      const panels = await influxdbService.getDashboardData();

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
        status: 'OK',
        data: formattedData
      });
    } catch (error) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  }

  async getYearlyStats(req, res) {
    try {
      const year = req.query.year || new Date().getFullYear();
      const stats = await influxdbService.getTotalEnergyUsage(parseInt(year));
      
      res.json({
        status: 'OK',
        data: {
          year: year,
          monthly_stats: stats
        }
      });
    } catch (error) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  }
}

module.exports = new EnergyController();