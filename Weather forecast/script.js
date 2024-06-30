const apiKey = 'a7145f28d09f78d88d05b6e22ecd6013';

document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => fetchWeatherDataByCoords(position.coords.latitude, position.coords.longitude),
            () => fetchWeatherData('Rivne')
        );
    } else {
        fetchWeatherData('Rivne');
    }
});

function searchCity(event) {
    if (event.key === 'Enter') {
        fetchWeatherData(event.target.value);
    }
}

function searchCityByButton() {
    fetchWeatherData(document.getElementById('cityInput').value);
}

async function fetchWeatherDataByCoords(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        const data = await response.json();
        updateWeatherData(data);
        fetchAdditionalData(lat, lon);
    } catch (error) {
        showError();
    }
}

async function fetchWeatherData(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        if (!response.ok) throw new Error('City not found');
        const data = await response.json();
        updateWeatherData(data);
        const { lat, lon } = data.coord;
        fetchAdditionalData(lat, lon);
    } catch (error) {
        showError();
    }
}

async function fetchAdditionalData(lat, lon) {
    fetchHourlyForecast(lat, lon);
    fetchFiveDayForecast(lat, lon);
    fetchNearbyCities(lat, lon);
}

function updateWeatherData(data) {
    const { name, main, weather, wind, sys } = data;
    const weatherHtml = `
        <h3>${name}</h3>
        <p>${new Date().toLocaleDateString()}</p>
        <p><img src="http://openweathermap.org/img/wn/${weather[0].icon}.png" alt="${weather[0].description}"> ${weather[0].description}</p>
        <p>Temperature: ${main.temp}°C (Feels like ${main.feels_like}°C)</p>
        <p>Wind: ${wind.speed} m/s</p>
        <p>Sunrise: ${new Date(sys.sunrise * 1000).toLocaleTimeString()}</p>
        <p>Sunset: ${new Date(sys.sunset * 1000).toLocaleTimeString()}</p>
        <p>Day Duration: ${calculateDayDuration(sys.sunrise, sys.sunset)}</p>
    `;
    document.getElementById('currentWeather').innerHTML = weatherHtml;
}

async function fetchHourlyForecast(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    const hourlyHtml = data.list.slice(0, 8).map(hour => `
        <div class="card-1">
            <div class="card-body">
                <p>${new Date(hour.dt * 1000).toLocaleTimeString()}</p>
                <p><img src="http://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="${hour.weather[0].description}"> ${hour.weather[0].description}</p>
                <p>Temp: ${hour.main.temp}°C (Feels like ${hour.main.feels_like}°C)</p>
                <p>Wind: ${hour.wind.speed} m/s</p>
            </div>
        </div>
    `).join('');
    document.getElementById('hourlyForecast').innerHTML = hourlyHtml;
}

async function fetchFiveDayForecast(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    
    const today = new Date().toLocaleDateString();
    
    const filteredData = data.list.filter(item => {
        const itemDate = new Date(item.dt * 1000).toLocaleDateString();
        return itemDate !== today;
    });

    const dailyHtml = filteredData.filter((_, index) => index % 8 === 0).slice(0, 5).map(day => `
        <div class="card-2 day" onclick="displayDailyForecast(${day.dt})" id="day-${day.dt}">
            <div class="card-body">
                <p>${new Date(day.dt * 1000).toLocaleDateString()}</p>
                <p><img src="http://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}"> ${day.weather[0].description}</p>
                <p>Temp: ${day.main.temp}°C</p>
                <p>Wind: ${day.wind.speed} m/s</p>
            </div>
        </div>
    `).join('');
    
    document.getElementById('dailyForecast').innerHTML = dailyHtml;
    window.dailyForecast = filteredData.filter((_, index) => index % 8 === 0).slice(0, 5);
    window.hourlyForecast = data.list;

    displayDailyForecast(window.dailyForecast[0].dt);
    document.getElementById(`day-${window.dailyForecast[0].dt}`).classList.add('selected');
}


function displayDailyForecast(dt) {
    const selectedDay = window.dailyForecast.find(day => day.dt === dt);
    const hourlyForecast = window.hourlyForecast.filter(hour => {
        const hourDate = new Date(hour.dt * 1000);
        const selectedDate = new Date(selectedDay.dt * 1000);
        return hourDate.toLocaleDateString() === selectedDate.toLocaleDateString();
    });

    document.querySelectorAll('.day').forEach(day => day.classList.remove('selected'));
    document.getElementById(`day-${dt}`).classList.add('selected');

    const selectedDayHtml = `
        <h3>${new Date(selectedDay.dt * 1000).toLocaleDateString()}</h3>
        <table class="table">
            <tr>
                <th class="table-el">Time</th>
                <th class="table-el">Forecast</th>
                <th class="table-el">Temp (°C)</th>
                <th class="table-el">RealFeel</th>
                <th class="table-el">Wind (km/h)</th>
            </tr>
            ${hourlyForecast.map(hour => `
                <tr>
                    <td class="table-el">${new Date(hour.dt * 1000).toLocaleTimeString()}</td>
                    <td class="table-el"><img src="http://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="${hour.weather[0].description}"> ${hour.weather[0].description}</td>
                    <td class="table-el">${hour.main.temp}°C</td>
                    <td class="table-el">${hour.main.feels_like}°C</td>
                    <td class="table-el">${hour.wind.speed} m/s</td>
                </tr>
            `).join('')}
        </table>
    `;
    document.getElementById('selectedDayForecast').innerHTML = selectedDayHtml;
}

async function fetchNearbyCities(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=5&appid=${apiKey}&units=metric`);
    const data = await response.json();
    const nearbyHtml = data.list.map(city => `
        <div class="card-2">
            <div class="card-body">
                <h4>${city.name}</h4>
                <p><img src="http://openweathermap.org/img/wn/${city.weather[0].icon}.png" alt="${city.weather[0].description}"> ${city.weather[0].description}</p>
                <p>Temp: ${city.main.temp}°C</p>
                <p>Wind: ${city.wind.speed} m/s</p>
            </div>
        </div>
    `).join('');
    document.getElementById('nearbyCities').innerHTML = nearbyHtml;
}

function calculateDayDuration(sunrise, sunset) {
    const duration = (sunset - sunrise) / 3600;
    const hours = Math.floor(duration);
    const minutes = Math.floor((duration - hours) * 60);
    return `${hours} hr ${minutes} min`;
}

function showError() {
    document.getElementById('nav-tabContent').innerHTML = `
        <div class="error">
            <p>City not found. Please enter a different location.</p>
            <img src="./error.png" alt="Error">
        </div>`;
}
