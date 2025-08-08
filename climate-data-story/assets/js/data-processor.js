/**
 * CLIMATE DATA PROCESSOR
 * Procesamiento y análisis de datos de cambio climático
 */

class ClimateDataProcessor {
  constructor() {
    this.rawData = [];
    this.processedData = [];
    this.countries = [];
    this.years = [];
    this.globalStats = {};
    this.isDataLoaded = false;
  }

  /**
   * Procesa el archivo CSV subido
   */
  async processCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            this.rawData = results.data;
            this.cleanAndProcessData();
            this.calculateGlobalStats();
            this.isDataLoaded = true;
            resolve({
              success: true,
              rowCount: this.rawData.length,
              countries: this.countries.length,
              yearRange: this.getYearRange(),
              stats: this.globalStats
            });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Limpia y procesa los datos en bruto
   */
  cleanAndProcessData() {
    this.processedData = this.rawData
      .filter(row => row.Year && row.Country && row['Total.CO2'])
      .map(row => ({
        year: parseInt(row.Year),
        country: row.Country,
        iso: row['ISO.alpha-3'] || '',
        totalCO2: parseFloat(row['Total.CO2']) || 0,
        coalCO2: parseFloat(row['Coal.CO2']) || 0,
        oilCO2: parseFloat(row['Oil.CO2']) || 0,
        gasCO2: parseFloat(row['Gas.CO2']) || 0,
        cementCO2: parseFloat(row['Cement.CO2']) || 0,
        flaringCO2: parseFloat(row['Flaring.CO2']) || 0,
        otherCO2: parseFloat(row['Other.CO2']) || 0,
        perCapitaCO2: parseFloat(row['Per.Capita.CO2']) || 0,
        totalEnergy: parseFloat(row['Total.Energy.Production']) || 0,
        coalEnergy: parseFloat(row['Coal.Energy']) || 0,
        gasEnergy: parseFloat(row['Gas.Energy']) || 0,
        petroleumEnergy: parseFloat(row['Petroleum.and.other.liquids.Energy']) || 0,
        nuclearEnergy: parseFloat(row['Nuclear.Energy']) || 0,
        renewablesEnergy: parseFloat(row['Renewables.and.other.Energy']) || 0,
        ch4: parseFloat(row['CH4']) || 0,
        population: parseFloat(row['Population']) || 0,
        tempChange: parseFloat(row['Temp_Change']) || 0
      }));

    // Extraer países y años únicos
    this.countries = [...new Set(this.processedData.map(d => d.country))].sort();
    this.years = [...new Set(this.processedData.map(d => d.year))].sort();
  }

  /**
   * Calcula estadísticas globales
   */
  calculateGlobalStats() {
    if (this.processedData.length === 0) return;

    const latestYear = Math.max(...this.years);
    const latestData = this.processedData.filter(d => d.year === latestYear);
    
    this.globalStats = {
      totalCountries: this.countries.length,
      yearRange: this.getYearRange(),
      latestYear: latestYear,
      totalEmissions: this.sumByProperty(latestData, 'totalCO2'),
      averagePerCapita: this.averageByProperty(latestData, 'perCapitaCO2'),
      totalPopulation: this.sumByProperty(latestData, 'population'),
      averageTempChange: this.averageByProperty(latestData, 'tempChange'),
      topEmitters: this.getTopEmitters(latestData, 10),
      energyMix: this.getGlobalEnergyMix(latestData),
      emissionsBySource: this.getEmissionsBySource(latestData)
    };
  }

  /**
   * Obtiene el rango de años
   */
  getYearRange() {
    if (this.years.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...this.years),
      max: Math.max(...this.years)
    };
  }

  /**
   * Suma valores por propiedad
   */
  sumByProperty(data, property) {
    return data.reduce((sum, item) => sum + (item[property] || 0), 0);
  }

  /**
   * Promedio por propiedad
   */
  averageByProperty(data, property) {
    const validData = data.filter(item => item[property] && item[property] > 0);
    if (validData.length === 0) return 0;
    return validData.reduce((sum, item) => sum + item[property], 0) / validData.length;
  }

  /**
   * Obtiene los principales emisores
   */
  getTopEmitters(data, count = 10) {
    return data
      .filter(d => d.totalCO2 > 0)
      .sort((a, b) => b.totalCO2 - a.totalCO2)
      .slice(0, count)
      .map(d => ({
        country: d.country,
        emissions: d.totalCO2,
        perCapita: d.perCapitaCO2,
        population: d.population
      }));
  }

  /**
   * Obtiene el mix energético global
   */
  getGlobalEnergyMix(data) {
    const totalCoal = this.sumByProperty(data, 'coalEnergy');
    const totalGas = this.sumByProperty(data, 'gasEnergy');
    const totalPetroleum = this.sumByProperty(data, 'petroleumEnergy');
    const totalNuclear = this.sumByProperty(data, 'nuclearEnergy');
    const totalRenewables = this.sumByProperty(data, 'renewablesEnergy');
    const total = totalCoal + totalGas + totalPetroleum + totalNuclear + totalRenewables;

    if (total === 0) return {};

    return {
      coal: { value: totalCoal, percentage: (totalCoal / total) * 100 },
      gas: { value: totalGas, percentage: (totalGas / total) * 100 },
      petroleum: { value: totalPetroleum, percentage: (totalPetroleum / total) * 100 },
      nuclear: { value: totalNuclear, percentage: (totalNuclear / total) * 100 },
      renewables: { value: totalRenewables, percentage: (totalRenewables / total) * 100 }
    };
  }

  /**
   * Obtiene emisiones por fuente
   */
  getEmissionsBySource(data) {
    const totalCoal = this.sumByProperty(data, 'coalCO2');
    const totalOil = this.sumByProperty(data, 'oilCO2');
    const totalGas = this.sumByProperty(data, 'gasCO2');
    const totalCement = this.sumByProperty(data, 'cementCO2');
    const totalFlaring = this.sumByProperty(data, 'flaringCO2');
    const totalOther = this.sumByProperty(data, 'otherCO2');
    const total = totalCoal + totalOil + totalGas + totalCement + totalFlaring + totalOther;

    if (total === 0) return {};

    return {
      coal: { value: totalCoal, percentage: (totalCoal / total) * 100 },
      oil: { value: totalOil, percentage: (totalOil / total) * 100 },
      gas: { value: totalGas, percentage: (totalGas / total) * 100 },
      cement: { value: totalCement, percentage: (totalCement / total) * 100 },
      flaring: { value: totalFlaring, percentage: (totalFlaring / total) * 100 },
      other: { value: totalOther, percentage: (totalOther / total) * 100 }
    };
  }

  /**
   * Filtra datos por año
   */
  getDataByYear(year) {
    return this.processedData.filter(d => d.year === year);
  }

  /**
   * Filtra datos por país
   */
  getDataByCountry(country) {
    return this.processedData.filter(d => d.country === country);
  }

  /**
   * Filtra datos por rango de años
   */
  getDataByYearRange(startYear, endYear) {
    return this.processedData.filter(d => d.year >= startYear && d.year <= endYear);
  }

  /**
   * Obtiene datos de un país por año
   */
  getCountryTimeSeriesData(country) {
    const countryData = this.getDataByCountry(country);
    return countryData.sort((a, b) => a.year - b.year);
  }

  /**
   * Obtiene tendencias globales por año
   */
  getGlobalTrends() {
    const trends = {};
    
    this.years.forEach(year => {
      const yearData = this.getDataByYear(year);
      trends[year] = {
        totalEmissions: this.sumByProperty(yearData, 'totalCO2'),
        averagePerCapita: this.averageByProperty(yearData, 'perCapitaCO2'),
        totalPopulation: this.sumByProperty(yearData, 'population'),
        averageTempChange: this.averageByProperty(yearData, 'tempChange'),
        energyMix: this.getGlobalEnergyMix(yearData)
      };
    });
    
    return trends;
  }

  /**
   * Compara países
   */
  compareCountries(countries, metric = 'totalCO2') {
    const latestYear = Math.max(...this.years);
    const comparison = [];
    
    countries.forEach(country => {
      const countryData = this.processedData.find(d => 
        d.country === country && d.year === latestYear
      );
      
      if (countryData) {
        comparison.push({
          country: country,
          value: countryData[metric] || 0,
          data: countryData
        });
      }
    });
    
    return comparison.sort((a, b) => b.value - a.value);
  }

  /**
   * Obtiene correlación CO2-Temperatura
   */
  getTemperatureCorrelation() {
    const correlationData = this.years.map(year => {
      const yearData = this.getDataByYear(year);
      return {
        year: year,
        totalCO2: this.sumByProperty(yearData, 'totalCO2'),
        avgTempChange: this.averageByProperty(yearData, 'tempChange')
      };
    }).filter(d => d.totalCO2 > 0 && d.avgTempChange !== 0);
    
    return correlationData;
  }

  /**
   * Genera datos para predicciones
   */
  generatePredictionData(scenario = 'current') {
    const trends = this.getGlobalTrends();
    const trendKeys = Object.keys(trends).map(Number).sort((a, b) => a - b);
    
    if (trendKeys.length < 3) return [];
    
    const recentYears = trendKeys.slice(-5);
    const avgGrowthRate = this.calculateAverageGrowthRate(recentYears, trends, 'totalEmissions');
    
    const predictions = [];
    const startYear = Math.max(...this.years) + 1;
    const endYear = startYear + 10;
    
    let multiplier;
    switch (scenario) {
      case 'optimistic':
        multiplier = 0.5; // Reducción del 50% en la tasa de crecimiento
        break;
      case 'pessimistic':
        multiplier = 1.5; // Aumento del 50% en la tasa de crecimiento
        break;
      default:
        multiplier = 1; // Tendencia actual
    }
    
    const lastValue = trends[trendKeys[trendKeys.length - 1]].totalEmissions;
    
    for (let year = startYear; year <= endYear; year++) {
      const yearsFromStart = year - startYear;
      const predictedValue = lastValue * Math.pow(1 + (avgGrowthRate * multiplier), yearsFromStart);
      
      predictions.push({
        year: year,
        predicted: Math.max(0, predictedValue),
        scenario: scenario
      });
    }
    
    return predictions;
  }

  /**
   * Calcula tasa de crecimiento promedio
   */
  calculateAverageGrowthRate(years, trends, metric) {
    const growthRates = [];
    
    for (let i = 1; i < years.length; i++) {
      const currentValue = trends[years[i]][metric];
      const previousValue = trends[years[i - 1]][metric];
      
      if (previousValue > 0) {
        const growthRate = (currentValue - previousValue) / previousValue;
        growthRates.push(growthRate);
      }
    }
    
    return growthRates.length > 0 
      ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
      : 0;
  }

  /**
   * Busca países por nombre
   */
  searchCountries(query) {
    return this.countries.filter(country => 
      country.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Obtiene estadísticas de un país específico
   */
  getCountryStats(country) {
    const countryData = this.getDataByCountry(country);
    
    if (countryData.length === 0) return null;
    
    const latestData = countryData[countryData.length - 1];
    const earliestData = countryData[0];
    
    return {
      country: country,
      dataPoints: countryData.length,
      yearRange: {
        start: earliestData.year,
        end: latestData.year
      },
      latest: latestData,
      trends: {
        co2Change: latestData.totalCO2 - earliestData.totalCO2,
        perCapitaChange: latestData.perCapitaCO2 - earliestData.perCapitaCO2,
        tempChange: latestData.tempChange - earliestData.tempChange
      },
      rankings: this.getCountryRankings(country)
    };
  }

  /**
   * Obtiene rankings de un país
   */
  getCountryRankings(country) {
    const latestYear = Math.max(...this.years);
    const latestData = this.getDataByYear(latestYear);
    
    const totalRanking = latestData
      .filter(d => d.totalCO2 > 0)
      .sort((a, b) => b.totalCO2 - a.totalCO2)
      .findIndex(d => d.country === country) + 1;
    
    const perCapitaRanking = latestData
      .filter(d => d.perCapitaCO2 > 0)
      .sort((a, b) => b.perCapitaCO2 - a.perCapitaCO2)
      .findIndex(d => d.country === country) + 1;
    
    return {
      totalEmissions: totalRanking || 'N/A',
      perCapitaEmissions: perCapitaRanking || 'N/A',
      totalCountries: latestData.length
    };
  }

  /**
   * Exporta datos procesados
   */
  exportData(format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.processedData, null, 2);
      case 'csv':
        return Papa.unparse(this.processedData);
      default:
        return this.processedData;
    }
  }

  /**
   * Obtiene resumen de datos
   */
  getDataSummary() {
    return {
      isLoaded: this.isDataLoaded,
      totalRecords: this.processedData.length,
      countries: this.countries.length,
      years: this.years.length,
      yearRange: this.getYearRange(),
      globalStats: this.globalStats
    };
  }
}

// Función utilitaria para formatear números
const formatNumber = (num, decimals = 2) => {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
};

// Función utilitaria para formatear porcentajes
const formatPercentage = (num, decimals = 1) => {
  return num.toFixed(decimals) + '%';
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ClimateDataProcessor = ClimateDataProcessor;
  window.formatNumber = formatNumber;
  window.formatPercentage = formatPercentage;
}