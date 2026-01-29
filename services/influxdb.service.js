const { InfluxDBClient } = require('@influxdata/influxdb3-client');
const config = require('../config/config');

class InfluxDBService {
    constructor() {
        this.client = null;
    }

    async connect() {
        try {
            this.client = new InfluxDBClient({
                host: config.influxdb.host,
                token: config.influxdb.token,
            });
            console.log('Connected to InfluxDB v3 Core');
        } catch (error) {
            console.error('InfluxDB Connection Error:', error.message);
            throw error;
        }
    }

    async writeData(panelId, data) {
        try {
            const { v, i, kw, kwh, klh, pf, time } = data;

            const kwhValue = kwh || klh;

            if (!v || !i || kw === undefined || kwhValue === undefined || !time) {
                console.error(`Invalid data from ${panelId}:`, data);
                return false;
            }

            const vFields = v.map((val, idx) => `v_${idx}=${parseFloat(val) || 0}`).join(',');
            const iFields = i.map((val, idx) => `i_${idx}=${parseFloat(val) || 0}`).join(',');
            const kwValue = parseFloat(kw) || 0;
            const kwhVal = parseFloat(kwhValue) || 0;
            const pfValue = parseFloat(pf) || 0;

            const timestamp = new Date(time);
            if (isNaN(timestamp.getTime())) {
                console.error(`Invalid timestamp from ${panelId}:`, time);
                return false;
            }
            const unixTime = timestamp.getTime() * 1000000;

            const line = `energy_monitoring,pmCode=${panelId} ${vFields},${iFields},kW=${kwValue},kWh=${kwhVal},pf=${pfValue} ${unixTime}`;

            await this.client.write(line, config.influxdb.database);
            console.log(`Data Saved: ${panelId} | kWh: ${kwhVal}`);
            return true;
        } catch (error) {
            console.error(`ERROR: Write to InfluxDB failed.`, error);
            return false;
        }
    }

    async getDashboardData() {
        try {
            const today = new Date().toISOString().split('T')[0];

            const query = `
                SELECT 
                    "pmCode",
                    MAX("kWh") as current_kwh, 
                    MAX("kW") as current_kw, 
                    MAX("v_0") as v0, 
                    MAX("i_1") as i1, 
                    MIN("kWh") as start_kwh, 
                    MAX(time) as last_time
                FROM energy_monitoring
                WHERE time >= '${today}T00:00:00Z'
                GROUP BY "pmCode"
            `;

            const result = await this.client.query(query, config.influxdb.database);
            const panels = [];

            for await (const row of result) {
                const currentKwh = parseFloat(row.current_kwh) || 0;
                const startKwh = parseFloat(row.start_kwh) || 0;
                const usage = currentKwh - startKwh;
                
                const lastSeen = new Date(row.last_time);
                const isOffline = (new Date() - lastSeen) > 5 * 60 * 1000;

                panels.push({
                    pmCode: row.pmCode,
                    v_0: row.v0,
                    i_1: row.i1,
                    kW: row.current_kw,
                    kWh: currentKwh,
                    todayUsage: usage > 0 ? usage.toFixed(2) : "0.00",
                    status: isOffline ? 'OFFLINE' : 'ONLINE',
                    time: row.last_time
                });
            }
            return panels;
        } catch (error) {
            console.error('Influx Query Error:', error.message);
            return [];
        }
    }

    async getTotalEnergyUsage(year) {
        try {
            const query = `
            SELECT 
                DATE_TRUNC('month', time) as month,
                "pmCode",
                (MAX("kWh") - MIN("kWh")) as monthly_usage
            FROM energy_monitoring
            WHERE time >= '${year}-01-01T00:00:00Z'
                AND time < '${year + 1}-01-01T00:00:00Z'
            GROUP BY month, "pmCode"
            ORDER BY month ASC
            `;

            const result = await this.client.query(query, config.influxdb.database);
            const stats = [];

            for await (const row of result) {
                stats.push({
                    month: row.month,
                    panel: row.pmCode,
                    energy_kwh: parseFloat(row.monthly_usage) > 0 ? parseFloat(row.monthly_usage).toFixed(2) : "0.00"
                });
            }
            return stats;
        } catch (error) {
            console.error('Error querying yearly stats:', error.message);
            return [];
        }
    }

    async getTodayUsage(panelId) {
        try {
            const today = new Date().toISOString().split('T')[0];

            const query = `
                SELECT 
                    MIN("kWh") as start_kwh,
                    MAX("kWh") as current_kwh
                FROM energy_monitoring
                WHERE "pmCode" = '${panelId}'
                    AND time >= '${today}T00:00:00Z'
            `;

            const result = await this.client.query(query, config.influxdb.database);
            
            for await (const row of result) {
                const startKwh = parseFloat(row.start_kwh) || 0;
                const currentKwh = parseFloat(row.current_kwh) || 0;
                const usage = currentKwh - startKwh;

                if (currentKwh === 0 && startKwh === 0) {
                    return null;
                }

                return {
                    startKwh: startKwh,
                    currentKwh: currentKwh,
                    todayUsage: usage > 0 ? usage.toFixed(2) : "0.00"
                };
            }

            return null;
        } catch (error) {
            console.error('Error querying today usage:', error.message);
            return null;
        }
    }

    async close() {
        if (this.client) await this.client.close();
    }
}

module.exports = new InfluxDBService();