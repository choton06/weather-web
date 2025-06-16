// OpenWeatherMap API details
const API_KEY = '97248b57b850880947ad865aa9204fea';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// Elements
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const cityInput = document.getElementById('cityInput');
const weatherDataDiv = document.getElementById('weatherData');
const extendedForecastDiv = document.getElementById('extendedForecast');
const forecastListDiv = document.getElementById('forecastList');
const recentSearchesDropdown = document.getElementById('recentSearchesDropdown');
const recentSearchesContainer = document.getElementById('recentSearchesContainer');
const errorMessage = document.getElementById('errorMessage');

// Loader (optional visual feedback)
function toggleLoading(show = true) {
    if (show) {
        searchBtn.textContent = "Loading...";
        searchBtn.disabled = true;
    } else {
        searchBtn.textContent = "🔍 Search Weather";
        searchBtn.disabled = false;
    }
}

// Fetch weather data by city name
async function fetchWeatherByCity(city) {
    try {
        toggleLoading(true);
        const response = await fetch(`${WEATHER_API_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error('City not found');
        const data = await response.json();
        updateWeatherUI(data);
        saveCityToLocalStorage(city);
    } catch (error) {
        displayError(error.message);
    } finally {
        toggleLoading(false);
    }
}

// Fetch weather data by current location
async function fetchWeatherByLocation(lat, lon) {
    try {
        toggleLoading(true);
        const response = await fetch(`${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error('Unable to fetch location data');
        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        displayError(error.message);
    } finally {
        toggleLoading(false);
    }
}

// Update UI with weather data
function updateWeatherUI(data) {
    weatherDataDiv.querySelector('#locationName').textContent = `${data.name}, ${data.sys.country}`;
    weatherDataDiv.querySelector('#temperature').textContent = `Temperature: ${data.main.temp}°C`;
    weatherDataDiv.querySelector('#humidity').textContent = `Humidity: ${data.main.humidity}%`;
    weatherDataDiv.querySelector('#windSpeed').textContent = `Wind Speed: ${data.wind.speed} m/s`;

    const weatherIcon = weatherDataDiv.querySelector('#weatherIcon');
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description || "Weather icon";

    weatherDataDiv.classList.remove('hidden');
    fetchExtendedForecast(data.coord.lat, data.coord.lon);
}

// Fetch extended 5-day forecast
async function fetchExtendedForecast(lat, lon) {
    try {
        const response = await fetch(`${FORECAST_API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error('Unable to fetch forecast data');
        const data = await response.json();
        updateForecastUI(data.list);
    } catch (error) {
        displayError(error.message);
    }
}

// Update extended forecast UI
function updateForecastUI(forecastList) {
    forecastListDiv.innerHTML = '';
    forecastList.forEach((item, index) => {
        if (index % 8 === 0) {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'bg-blue-100 p-2 rounded text-sm text-center';
            forecastItem.innerHTML = `
                <p class="font-semibold">${new Date(item.dt_txt).toLocaleDateString()}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
                <p>Temp: ${item.main.temp}°C</p>
                <p>Humidity: ${item.main.humidity}%</p>
                <p>Wind: ${item.wind.speed} m/s</p>
            `;
            forecastListDiv.appendChild(forecastItem);
        }
    });
    extendedForecastDiv.classList.remove('hidden');
}

// Save city to local storage (normalized)
function saveCityToLocalStorage(city) {
    let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
    const lowerCity = city.toLowerCase();
    if (!recentCities.includes(lowerCity)) {
        recentCities.push(lowerCity);
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        updateRecentSearchesDropdown();
    }
}

// Update recent searches dropdown
function updateRecentSearchesDropdown() {
    const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
    recentSearchesDropdown.innerHTML = '';
    if (recentCities.length > 0) {
        recentCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city.charAt(0).toUpperCase() + city.slice(1);
            recentSearchesDropdown.appendChild(option);
        });
        recentSearchesContainer.classList.remove('hidden');
    } else {
        recentSearchesContainer.classList.add('hidden');
    }
}

// Display error messages and clear previous data
function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    weatherDataDiv.classList.add('hidden');
    extendedForecastDiv.classList.add('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) {
        displayError('Please enter a city name');
        return;
    }
    if (!/^[a-zA-Z\s]+$/.test(city)) {
        displayError('City name must contain only letters');
        return;
    }
    fetchWeatherByCity(city);
    cityInput.value = '';
});

currentLocationBtn.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByLocation(latitude, longitude);
    }, () => {
        displayError('Unable to fetch your location');
    });
});

recentSearchesDropdown.addEventListener('change', (e) => {
    fetchWeatherByCity(e.target.value);
});

// Load recent searches on page load
window.onload = updateRecentSearchesDropdown;
