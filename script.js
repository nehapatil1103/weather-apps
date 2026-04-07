const apiKey = "d8e6fe0a2ba1a709b56a742adfc3178a";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const loading = document.getElementById("loading");
const error = document.getElementById("error");

const forecastDiv = document.getElementById("forecast");

let unit = "metric";
let chart;


/* SEARCH */

searchBtn.addEventListener("click", () => {
  if (cityInput.value.trim() !== "") {
    getWeather(cityInput.value);
  }
});

cityInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    getWeather(cityInput.value);
  }
});


/* MAIN WEATHER FUNCTION */

async function getWeather(city){

loading.classList.remove("hidden");
error.classList.add("hidden");

try{

/* GEO SEARCH */

const geoURL =
`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${apiKey}`;

const geoRes = await fetch(geoURL);
const geoData = await geoRes.json();

if(geoData.length === 0){
throw new Error("Location not found");
}

/* Prefer India */

let location = geoData.find(loc => loc.country === "IN");

if(!location){
location = geoData[0];
}

const lat = location.lat;
const lon = location.lon;


/* WEATHER */

const weatherURL =
`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;

const forecastURL =
`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;

const weatherRes = await fetch(weatherURL);
const weather = await weatherRes.json();


displayCurrentWeather(weather, location);

getAQI(lat,lon);


/* FORECAST */

const forecastRes = await fetch(forecastURL);
const forecast = await forecastRes.json();

displayForecast(forecast);
displayHourly(forecast);
createChart(forecast);

}catch(err){

error.textContent = err.message;
error.classList.remove("hidden");

}

loading.classList.add("hidden");

}



/* CURRENT WEATHER */

function displayCurrentWeather(data, location){

document.getElementById("currentWeather").classList.remove("hidden");

document.getElementById("cityName").textContent =
`${location.name}, ${location.state || ""}, ${location.country}`;

document.getElementById("temperature").textContent =
Math.round(data.main.temp) + "°";

document.getElementById("condition").textContent =
data.weather[0].main;

document.getElementById("humidity").textContent =
data.main.humidity + "%";

document.getElementById("wind").textContent =
data.wind.speed + " m/s";

document.getElementById("feelsLike").textContent =
Math.round(data.main.feels_like) + "°";

document.getElementById("dateTime").textContent =
new Date().toLocaleString();


document.getElementById("sunrise").textContent =
new Date(data.sys.sunrise * 1000).toLocaleTimeString();

document.getElementById("sunset").textContent =
new Date(data.sys.sunset * 1000).toLocaleTimeString();

}



/* AQI */

async function getAQI(lat,lon){

const url =
`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

const res = await fetch(url);
const data = await res.json();

const aqi = data.list[0].main.aqi;

document.getElementById("aqiValue").textContent = aqi;

let status="Good";

if(aqi===2) status="Fair";
if(aqi===3) status="Moderate";
if(aqi===4) status="Poor";
if(aqi===5) status="Very Poor";

document.getElementById("aqiStatus").textContent = status;

}



/* 5 DAY FORECAST */

function displayForecast(data){

forecastDiv.innerHTML = "";

const daily = data.list.filter(item =>
item.dt_txt.includes("12:00:00")
);

daily.forEach(day =>{

const card = document.createElement("div");

card.classList.add("forecast-card");

card.innerHTML = `
<h4>${new Date(day.dt_txt).toDateString()}</h4>
<img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
<p>${Math.round(day.main.temp)}°</p>
<p>${day.weather[0].main}</p>
`;

forecastDiv.appendChild(card);

});

}



/* HOURLY FORECAST */

function displayHourly(data){

const hourly = document.getElementById("hourly");

hourly.innerHTML = "";

data.list.slice(0,12).forEach(hour =>{

const card = document.createElement("div");

card.classList.add("hour-card");

const time = new Date(hour.dt_txt).getHours() + ":00";

card.innerHTML = `
<p>${time}</p>
<img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png">
<p>${Math.round(hour.main.temp)}°</p>
`;

hourly.appendChild(card);

});

}



/* TEMPERATURE CHART */

function createChart(data){

const temps = data.list.slice(0,8).map(i => i.main.temp);

const labels = data.list.slice(0,8).map(i =>
new Date(i.dt_txt).getHours() + ":00"
);

const ctx = document.getElementById("tempChart");

if(chart) chart.destroy();

chart = new Chart(ctx,{

type:"line",

data:{
labels:labels,
datasets:[{
data:temps,
borderColor:"#fff",
backgroundColor:"rgba(255,255,255,0.3)",
tension:0.4
}]
},

options:{
plugins:{legend:{display:false}},
scales:{
x:{ticks:{color:"#fff"}},
y:{ticks:{color:"#fff"}}
}

}

});

}



/* UNIT SWITCH */

document.getElementById("toggleUnit").addEventListener("click",()=>{

unit = unit === "metric" ? "imperial" : "metric";

if(cityInput.value){
getWeather(cityInput.value);
}

});



/* DARK MODE */

document.getElementById("themeToggle").addEventListener("click",()=>{
document.body.classList.toggle("dark");
});



/* GEOLOCATION */

navigator.geolocation.getCurrentPosition(async position =>{

const lat = position.coords.latitude;
const lon = position.coords.longitude;

const url =
`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;

const res = await fetch(url);
const data = await res.json();

displayCurrentWeather(data,{
name:data.name,
state:"",
country:data.sys.country
});

getAQI(lat,lon);

});



/* MAP */

let map = L.map("map").setView([20.5937,78.9629],5);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
).addTo(map);

L.tileLayer(
"https://tilecache.rainviewer.com/v2/radar/nowcast/256/{z}/{x}/{y}/2/1_1.png",
{opacity:0.6}
).addTo(map);


/* MAP CLICK WEATHER */

map.on("click", async function(e){

const lat = e.latlng.lat;
const lon = e.latlng.lng;

const weatherURL =
`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;

const res = await fetch(weatherURL);
const data = await res.json();

displayCurrentWeather(data,{
name:data.name || "Selected Location",
state:"",
country:data.sys.country
});

getAQI(lat,lon);

});