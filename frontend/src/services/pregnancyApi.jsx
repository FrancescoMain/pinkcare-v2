import ApiService from './apiService';

class PregnancyApi {

  static async getStatus() {
    return ApiService.get('/api/pregnancy/status');
  }

  static async calculate(lastMensesDate, durationPeriod) {
    return ApiService.post('/api/pregnancy/calculate', {
      lastMensesDate,
      durationPeriod
    });
  }

  static async save(childbirthdate, ovulationDate) {
    return ApiService.post('/api/pregnancy/save', {
      childbirthdate,
      ovulationDate
    });
  }

  static async terminate(pregnancyEndedDate) {
    return ApiService.post('/api/pregnancy/terminate', {
      pregnancyEndedDate
    });
  }
}

export default PregnancyApi;
