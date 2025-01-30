class WeatherModel {
    constructor() {
        this.cities = {
            'patiala': '10deg C',
            'delhi': '20deg C',
            'mohali': '14deg C',
            'chandigarh': '12deg C',
            'ludhiana': '15deg C',
            'amritsar': '11deg C',
            'jalandhar': '13deg C'
        };
    }

    getWeatherDetails(city) {
        return this.cities[city.toLowerCase()] || "City not found";
    }
}

export default WeatherModel; 