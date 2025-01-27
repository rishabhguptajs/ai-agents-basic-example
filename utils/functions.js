function getWeatherDetails(city) {
    if(city == 'patiala') {
        return "10deg C";
    } else if(city == 'mohali') {
        return "14deg C";
    } else if(city == 'delhi') {
        return "20deg C";
    } else if(city == 'chandigarh') {
        return "12deg C";
    } else if(city == 'ludhiana') {
        return "15deg C";
    } else if(city == 'amritsar') {
        return "11deg C";
    } else if(city == 'jalandhar') {
        return "13deg C";
    } else {
        return "City not found";
    }
}

export { getWeatherDetails }