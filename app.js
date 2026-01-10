// ===== AURAHEALTH ULTRA - COMPLETE JavaScript =====
// ===== WEATHER CONFIG =====
const WEATHER_CONFIG = {
  API_KEY: "6f731853752fe3afc0bfa077a1b08a15",
  GEO_URL: "https://api.openweathermap.org/geo/1.0/zip",
  WEATHER_URL: "https://api.openweathermap.org/data/2.5/weather"
};

// ===== GLOBAL STATE =====
let state = {
  steps: 0,
  water: 0,
  calories: 0,
  moods: [],
  activities: [],
  quizIndex: 0,
  quizScore: 0,
  earnedBadges: new Set(),
  userProfile: {},
  currentPage: 'main',
  weather: {
    pincode: null,
    location: null,
    temp: null,
    feelsLike: null,
    humidity: null,
    condition: null,
    description: null,
    lastUpdated: null
  }
};

// ===== QUIZ DATA =====
const quizData = [
  {q: "Regular exercise improves cardiovascular health", a: true},
  {q: "Skipping meals boosts metabolism", a: false},
  {q: "Drinking water aids digestion", a: true},
  {q: "Chronic stress has no physical effects", a: false},
  {q: "Walking daily improves mental clarity", a: true},
  {q: "Yoga increases stress and anxiety", a: false},
  {q: "Meditation can improve focus and concentration", a: true},
  {q: "Fast food strengthens the immune system", a: false},
  {q: "A balanced diet increases energy levels", a: true},
  {q: "Working without breaks prevents burnout", a: false},
  {q: "Quality sleep improves memory retention", a: true},
  {q: "High caffeine intake reduces long-term anxiety", a: false},
  {q: "Proper hydration improves skin health", a: true},
  {q: "Mental health directly affects physical health", a: true},
  {q: "Suppressing emotions is always healthy", a: false},
  {q: "Rest days are essential for muscle recovery", a: true},
  {q: "Anxiety is always a sign of personal weakness", a: false},
  {q: "Deep breathing exercises can calm the nervous system", a: true},
  {q: "A sedentary lifestyle has no health risks", a: false},
  {q: "Consistency is key to achieving fitness goals", a: true}
];

// ===== HELPER FUNCTIONS =====
function isOnline() {
  return navigator.onLine;
}

function validateAPIKey() {
  return WEATHER_CONFIG.API_KEY && WEATHER_CONFIG.API_KEY.length > 10;
}

function isValidIndianPincode(pincode) {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 21) return 'Evening';
  return 'Night';
}

function getSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 6) return 'Summer';
  if (month >= 7 && month <= 9) return 'Monsoon';
  return 'Winter';
}

// ===== WEATHER HELPER FUNCTIONS =====
function getCachedWeather() {
  try {
    const cached = localStorage.getItem('weatherCache');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (data.lastUpdated && (now - data.lastUpdated) < oneHour) {
      return data;
    }
    
    return null;
  } catch (e) {
    console.error('Error reading weather cache:', e);
    return null;
  }
}

function categorizeWeather(condition) {
  if (!condition) return 'unknown';
  
  const cond = condition.toLowerCase();
  
  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
    return 'rain';
  }
  if (cond.includes('thunder') || cond.includes('storm')) {
    return 'extreme';
  }
  if (cond.includes('snow') || cond.includes('sleet') || cond.includes('hail')) {
    return 'extreme';
  }
  if (cond.includes('cloud') || cond.includes('overcast') || cond.includes('mist') || cond.includes('fog')) {
    return 'clouds';
  }
  if (cond.includes('clear') || cond.includes('sun')) {
    return 'clear';
  }
  
  return 'unknown';
}

function categorizeTemperature(temp) {
  if (temp < 10) return 'cold';
  if (temp < 18) return 'cool';
  if (temp < 25) return 'moderate';
  if (temp < 32) return 'warm';
  if (temp < 40) return 'hot';
  return 'extreme';
}

function isSafeForOutdoor(weatherType, temp) {
  if (weatherType === 'extreme') return false;
  if (temp < 5 || temp > 40) return false;
  if (weatherType === 'rain') return false;
  return true;
}

// ===== WEATHER API FUNCTIONS =====
async function getCoordinatesFromPincode(pincode) {
  const response = await fetch(
    `${WEATHER_CONFIG.GEO_URL}?zip=${pincode},IN&appid=${WEATHER_CONFIG.API_KEY}`
  );
  if (!response.ok) throw new Error("Invalid pincode");
  return response.json();
}

async function getWeatherByCoordinates(lat, lon) {
  const response = await fetch(
    `${WEATHER_CONFIG.WEATHER_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_CONFIG.API_KEY}`
  );
  if (!response.ok) throw new Error("Weather not available");
  return response.json();
}

async function fetchWeatherByPincode(pincode) {
  if (!validateAPIKey()) {
    showAlert('Weather API key is missing', 'error');
    return;
  }
  
  if (!isValidIndianPincode(pincode)) {
    showAlert('Please enter a valid 6-digit Indian pincode', 'error');
    return;
  }

  try {
    showAlert('Fetching weather data...', 'success');

    const location = await getCoordinatesFromPincode(pincode);
    const weather = await getWeatherByCoordinates(location.lat, location.lon);

    state.weather = {
      pincode,
      location: location.name,
      temp: Math.round(weather.main.temp),
      feelsLike: Math.round(weather.main.feels_like),
      humidity: weather.main.humidity,
      condition: weather.weather[0].main,
      description: weather.weather[0].description,
      lastUpdated: Date.now()
    };

    localStorage.setItem('weatherCache', JSON.stringify(state.weather));

    displayWeatherInfo();
    loadDailyGuidance();
    
    showAlert(`Weather updated for ${location.name}!`, 'success');
  } catch (error) {
    console.error('Weather fetch error:', error);
    showAlert('Unable to fetch weather. Check pincode or try again later.', 'error');
  }
}

function fetchWeather() {
  const pincode = document.getElementById('weatherPincode').value.trim();
  if (!pincode) {
    showAlert('Please enter a pincode', 'error');
    return;
  }
  fetchWeatherByPincode(pincode);
}

function displayWeatherInfo() {
  let card = document.getElementById("weatherCard");

  if (!card) {
    card = document.createElement("div");
    card.id = "weatherCard";
    document.body.appendChild(card);
  }

  if (state.weather.temp !== null) {
    card.innerHTML = `
      <h4>📍 ${state.weather.location}</h4>
      <p style="font-size:32px;margin:12px 0;font-weight:700;color:var(--accent2)">${state.weather.temp}°C</p>
      <p style="font-size:16px;color:#cbd5e1;margin-bottom:8px">${state.weather.description}</p>
      <div style="display:flex;justify-content:space-around;margin-top:16px;font-size:14px">
        <div>
          <span style="color:#94a3b8">Feels Like</span><br>
          <strong style="color:var(--accent2)">${state.weather.feelsLike}°C</strong>
        </div>
        <div>
          <span style="color:#94a3b8">Humidity</span><br>
          <strong style="color:var(--accent2)">${state.weather.humidity}%</strong>
        </div>
      </div>
      <p style="font-size:11px;color:#64748b;margin-top:12px">Last updated: ${new Date(state.weather.lastUpdated).toLocaleString()}</p>
    `;
  }
}

// ===== ENHANCED RECOMMENDATION GENERATOR =====
function generateRecommendations() {
  if (!state.userProfile.age) {
    return [{
      title: '👤 Complete Profile',
      text: 'Please complete your profile to get personalized health recommendations!'
    }];
  }
  
  const { age, gender, height, weight, healthIssue, goal } = state.userProfile;
  const timeOfDay = getTimeOfDay();
  const season = getSeason();
  const recs = [];
  
  const h = height / 100;
  const bmi = weight / (h * h);
  const bodyType = bmi < 18.5 ? 'Underweight' : 
                   bmi < 25 ? 'Normal' : 
                   bmi < 30 ? 'Overweight' : 'Obese';
  
  const weatherData = getCachedWeather();
  const hasWeather = weatherData && weatherData.temp !== null;
  
  let temp = null;
  let humidity = null;
  let weatherType = null;
  let tempCategory = null;
  
  if (hasWeather) {
    temp = weatherData.temp;
    humidity = weatherData.humidity;
    weatherType = categorizeWeather(weatherData.condition);
    tempCategory = categorizeTemperature(temp);
  }
  
  // ===== HYDRATION =====
  let waterAmount = '2-3 liters';
  let hydrationAdvice = '';
  
  if (hasWeather) {
    if (tempCategory === 'hot' || tempCategory === 'extreme') {
      waterAmount = '4-5 liters';
      hydrationAdvice = ' Hot weather increases fluid loss through sweating.';
    } else if (tempCategory === 'warm') {
      waterAmount = '3-4 liters';
      hydrationAdvice = ' Warm conditions require extra hydration.';
    } else if (tempCategory === 'cold') {
      waterAmount = '2-2.5 liters';
      hydrationAdvice = ' Cold weather reduces thirst but hydration remains important.';
    } else {
      waterAmount = '2.5-3 liters';
    }
    
    if (humidity && humidity > 70) {
      hydrationAdvice += ' High humidity makes you sweat more - drink frequently.';
    }
  } else {
    if (season === 'Summer') {
      waterAmount = '3-4 liters';
    } else if (season === 'Winter') {
      waterAmount = '2-3 liters';
    }
  }
  
  if (bodyType === 'Overweight' || bodyType === 'Obese') {
    waterAmount = waterAmount.replace(/[\d.]+/, (match) => {
      const num = parseFloat(match);
      return (num + 0.5).toFixed(1);
    });
  }
  
  if (timeOfDay === 'Morning') {
    hydrationAdvice += ' Start with 2 glasses of warm water on empty stomach.';
  } else {
    hydrationAdvice += ' Keep sipping throughout the day - don\'t wait until thirsty.';
  }
  
  recs.push({
    title: '💧 Hydration',
    text: `Aim for ${waterAmount} daily.${hydrationAdvice}`
  });
  
  // ===== ACTIVITY =====
  let activity = '';
  let activityTiming = '';
  let indoorAlternative = '';
  
  if (age < 30) {
    activity = 'HIIT or running (30-45 min)';
    indoorAlternative = 'Indoor cardio, jumping jacks, burpees';
  } else if (age < 50) {
    activity = 'Brisk walking or moderate cardio (30-40 min)';
    indoorAlternative = 'Indoor walking, stationary cycling';
  } else {
    activity = 'Light walking and flexibility exercises (20-30 min)';
    indoorAlternative = 'Gentle stretching, indoor yoga';
  }
  
  if (hasWeather) {
    const safeOutdoor = isSafeForOutdoor(weatherType, temp);
    
    if (!safeOutdoor) {
      if (weatherType === 'rain') {
        activity = `${indoorAlternative} - Rainy weather, stay indoors`;
      } else if (weatherType === 'extreme') {
        activity = `${indoorAlternative} - Extreme weather warning, indoor exercise only`;
      } else if (temp < 5) {
        activity = `${indoorAlternative} - Too cold for outdoor activity`;
      } else if (temp > 40) {
        activity = `${indoorAlternative} - Dangerously hot, avoid outdoor exercise`;
      }
    } else {
      if (tempCategory === 'hot') {
        activityTiming = ' Best time: Early morning (6-8 AM) or evening (6-8 PM) to avoid heat.';
      } else if (tempCategory === 'warm') {
        activityTiming = ' Good weather for outdoor exercise. Stay in shade during peak heat.';
      } else if (tempCategory === 'cool' || tempCategory === 'moderate') {
        activityTiming = ' Perfect weather for outdoor activities!';
      } else if (tempCategory === 'cold') {
        activityTiming = ' Layer up with warm clothes. Warm up indoors before heading out.';
      }
      
      if (weatherType === 'clouds') {
        activityTiming += ' Cloudy weather provides natural sun protection.';
      } else if (weatherType === 'clear' && (tempCategory === 'warm' || tempCategory === 'hot')) {
        activityTiming += ' Use sunscreen SPF 30+.';
      }
    }
  } else {
    if (timeOfDay === 'Morning') {
      activityTiming = ' Morning is ideal for high-energy workouts.';
    } else if (timeOfDay === 'Evening') {
      activityTiming = ' Evening is great for strength training.';
    } else if (timeOfDay === 'Night') {
      activityTiming = ' Avoid intense exercise - opt for gentle stretching.';
    }
  }
  
  if (bodyType !== 'Normal') {
    activityTiming += ' Focus on consistency over intensity.';
  }
  
  recs.push({
    title: '🏃 Activity',
    text: activity + activityTiming
  });
  
  // ===== NUTRITION =====
  let nutrition = '';
  
  if (hasWeather) {
    if (tempCategory === 'hot' || tempCategory === 'extreme') {
      nutrition = 'Hydrating foods: cucumber, watermelon, mint, coconut water, citrus fruits, yogurt. Avoid heavy, oily foods.';
    } else if (tempCategory === 'cold') {
      nutrition = 'Warming foods: soups, ginger tea, nuts, oats, warm milk. Include vitamin C-rich foods for immunity.';
    } else if (tempCategory === 'warm') {
      nutrition = 'Light, fresh foods: salads, fruits, lean proteins, smoothies.';
    } else {
      nutrition = 'Balanced meals: whole grains, vegetables, lean proteins, healthy fats.';
    }
    
    if (weatherType === 'rain') {
      nutrition += ' Rainy weather: Warm soups, herbal teas, avoid street food to prevent infections.';
    }
  } else {
    if (season === 'Summer') {
      nutrition = 'Hydrating foods: cucumber, watermelon, mint, coconut water';
    } else if (season === 'Winter') {
      nutrition = 'Warming foods: soups, ginger tea, nuts, whole grains';
    } else {
      nutrition = 'Fresh vegetables, seasonal fruits, lean proteins';
    }
  }
  
  if (bodyType === 'Underweight') {
    nutrition += ' Add: eggs, nuts, protein shakes, healthy fats (avocado, olive oil).';
  } else if (bodyType === 'Overweight' || bodyType === 'Obese') {
    nutrition += ' Reduce: sugar, processed foods, fried items. Increase: fiber, vegetables, water intake.';
  }
  
  recs.push({
    title: '🍽️ Nutrition',
    text: nutrition
  });
  
  // ===== HEALTH CONDITION SPECIFIC =====
  if (healthIssue && healthIssue !== 'None' && healthIssue !== '') {
    const healthAdvice = {
      'BP': 'Limit sodium, manage stress, monitor BP regularly. ' + 
            (hasWeather && temp > 30 ? 'Hot weather can affect BP - stay hydrated and cool.' : 'Stay consistent with medication.'),
      'Diabetes': 'Low GI foods, regular meals, monitor blood sugar. ' + 
                  (hasWeather && tempCategory === 'hot' ? 'Heat can affect blood sugar - check levels frequently.' : 'Maintain meal timing.'),
      'PCOS': 'Regular exercise, balanced meals, manage weight, reduce refined carbs. ' +
              (hasWeather && weatherType === 'rain' ? 'Do indoor yoga or home workouts.' : 'Stay active daily.'),
      'Thyroid': 'Follow medication schedule, regular check-ups, balanced iodine intake. ' +
                 (hasWeather && tempCategory === 'cold' ? 'Cold sensitivity is common - dress warmly.' : 'Monitor symptoms regularly.'),
      'Asthma': 'Avoid triggers, breathing exercises, keep inhaler accessible. ' +
                (hasWeather && (weatherType === 'extreme' || humidity > 80) ? 'High humidity/storms can trigger symptoms - stay indoors.' : 'Monitor air quality.'),
      'Heart': 'Heart-healthy diet, moderate exercise, stress management. ' +
               (hasWeather && (tempCategory === 'extreme' || tempCategory === 'hot') ? 'Extreme temperatures strain the heart - limit outdoor activity.' : 'Regular check-ups.')
    };
    
    if (healthAdvice[healthIssue]) {
      recs.push({
        title: '🩺 Health Management',
        text: healthAdvice[healthIssue]
      });
    }
  }
  
  // ===== GOAL-SPECIFIC =====
  if (goal && goal !== '') {
    const goalAdvice = {
      'Weight Loss': 'Calorie deficit (300-500 kcal/day), strength + cardio, 7-8h sleep. ' +
                     (hasWeather && tempCategory === 'hot' ? 'Exercise in cooler hours. Hot weather boosts calorie burn.' : 'Stay consistent.'),
      'Muscle Gain': 'Protein (1.6-2g/kg), progressive overload, adequate rest days. ' +
                     (hasWeather && tempCategory === 'cold' ? 'Cold weather is ideal for building - eat more calories.' : 'Track your protein intake.'),
      'Mental Peace': '15 min daily meditation, journaling, limit screens before bed. ' +
                      (hasWeather && weatherType === 'rain' ? 'Rainy weather is perfect for indoor relaxation and mindfulness.' : 'Create a calm routine.'),
      'Healthy Lifestyle': 'Balanced routine: move daily, eat mindfully, sleep well. ' +
                           (hasWeather ? 'Adapt activities to weather conditions for consistency.' : 'Build sustainable habits.'),
      'Disease Management': 'Follow medical advice, consistent routine, track symptoms. ' +
                            (hasWeather && (weatherType === 'extreme' || tempCategory === 'extreme') ? 'Extreme weather can worsen symptoms - take precautions.' : 'Stay informed.')
    };
    
    if (goalAdvice[goal]) {
      recs.push({
        title: '🎯 Goal Focus',
        text: goalAdvice[goal]
      });
    }
  }
  
  // ===== TIME-SPECIFIC =====
  if (timeOfDay === 'Morning') {
    let morningAdvice = '5-min stretching, hydrate (2 glasses), protein breakfast within 2 hours.';
    if (hasWeather && tempCategory === 'cold') {
      morningAdvice += ' Cold morning: Warm up indoors before outdoor activity.';
    } else if (hasWeather && tempCategory === 'hot') {
      morningAdvice += ' Best time for outdoor exercise before heat peaks.';
    }
    recs.push({
      title: '🌅 Morning Routine',
      text: morningAdvice
    });
  } else if (timeOfDay === 'Night') {
    let nightAdvice = 'No screens 1h before bed, cool dark room, consistent schedule, 7-8h sleep.';
    if (hasWeather && tempCategory === 'hot') {
      nightAdvice += ' Use fan/AC for comfortable sleep temperature (20-22°C ideal).';
    } else if (hasWeather && tempCategory === 'cold') {
      nightAdvice += ' Keep room warm but not stuffy. Use layers instead of overheating.';
    }
    recs.push({
      title: '🌙 Sleep Hygiene',
      text: nightAdvice
    });
  }
  
  // ===== WEATHER ALERT =====
  if (hasWeather) {
    if (tempCategory === 'extreme' && temp > 40) {
      recs.push({
        title: '🚨 Heat Warning',
        text: `Temperature is ${temp}°C - EXTREME HEAT! Stay indoors, drink water every 30 min, avoid sun exposure. Risk of heat stroke.`
      });
    } else if (tempCategory === 'extreme' && temp < 0) {
      recs.push({
        title: '🚨 Cold Warning',
        text: `Temperature is ${temp}°C - EXTREME COLD! Stay indoors, wear multiple layers if going out. Risk of hypothermia.`
      });
    } else if (weatherType === 'extreme') {
      recs.push({
        title: '⚠️ Weather Alert',
        text: `${weatherData.condition} - Severe weather conditions. Stay indoors, postpone outdoor activities. Safety first.`
      });
    }
  }
  
  // ===== WEATHER DATA DISPLAY =====
  if (hasWeather) {
    recs.push({
      title: '🌤️ Current Weather',
      text: `${weatherData.location || 'Your area'}: ${temp}°C, ${weatherData.condition}, Humidity: ${humidity}%. Last updated: ${new Date(weatherData.lastUpdated).toLocaleTimeString()}`
    });
  } else {
    recs.push({
      title: '🌤️ Add Weather Data',
      text: 'Enter your pincode on the home screen to get weather-specific health recommendations!'
    });
  }
  
  return recs;
}

function loadDailyGuidance() {
  const recs = generateRecommendations();
  const html = recs.map(r => 
    `<div class="tip-card"><strong>${r.title}</strong>${r.text}</div>`
  ).join('');
  document.getElementById('guidanceContent').innerHTML = html;
}

function refreshGuidance() {
  loadDailyGuidance();
  showAlert('Recommendations refreshed with latest data!', 'success');
}

// ===== NAVIGATION =====
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active-nav'));
  const navBtn = document.getElementById('nav' + pageId.charAt(0).toUpperCase() + pageId.slice(1));
  if(navBtn) navBtn.classList.add('active-nav');
  
  state.currentPage = pageId;
  
  if(pageId === 'quiz' && state.quizIndex === 0) startQuiz();
  
  window.scrollTo(0, 0);
}

// ===== PROFILE MANAGEMENT =====
function saveProfile() {
  const name = document.getElementById('name').value.trim();
  const age = parseInt(document.getElementById('age').value);
  const gender = document.getElementById('gender').value;
  const height = parseInt(document.getElementById('height').value);
  const weight = parseInt(document.getElementById('weight').value);
  const blood = document.getElementById('blood').value;
  const healthIssue = document.getElementById('healthIssue').value;
  const goal = document.getElementById('goal').value;
  
  if(!name || !age || !gender || !height || !weight) {
    showAlert('Please fill all required fields!', 'error');
    return;
  }
  
  if(age < 1 || age > 120) {
    showAlert('Please enter a valid age', 'error');
    return;
  }
  
  if(height < 50 || height > 250) {
    showAlert('Please enter a valid height', 'error');
    return;
  }
  
  if(weight < 20 || weight > 300) {
    showAlert('Please enter a valid weight', 'error');
    return;
  }
  
  state.userProfile = { name, age, gender, height, weight, blood, healthIssue, goal };
  
  document.getElementById('welcome').innerText = `Welcome, ${name}!`;
  document.getElementById('dashAvatar').style.backgroundImage = 
    `url(https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)})`;
  
  if(gender === 'Female') {
    document.getElementById('femaleBox').style.display = 'block';
    document.getElementById('femaleDash').style.display = 'block';
  }
  
  document.getElementById('statsRow').style.display = 'grid';
  document.getElementById('quickActions').style.display = 'block';
  document.getElementById('profileCard').innerHTML = 
    '<div class="icon">✓</div><h3>Profile</h3><p>Completed</p>';
  document.getElementById('profileCard').classList.add('completed');
  
  loadDailyGuidance();
  updateMainStats();
  showAlert('Profile saved successfully!', 'success');
  
  setTimeout(() => navigateTo('dash'), 1500);
}

// ===== ACTIVITY TRACKING =====
function logActivity() {
  const minutes = parseInt(document.getElementById('minutes').value);
  const workType = document.getElementById('workType').value;
  
  if(!minutes || minutes <= 0) {
    showAlert('Please enter valid duration!', 'error');
    return;
  }
  
  const multipliers = {
    'Walking': 120, 'Running': 180, 'Cycling': 150, 
    'Gym': 140, 'Yoga': 80, 'Swimming': 160,
    'Dance': 130, 'Sports': 150
  };
  
  const stepsAdded = minutes * (multipliers[workType] || 120);
  state.steps += stepsAdded;
  
  state.activities.push({
    type: workType,
    duration: minutes,
    steps: stepsAdded,
    time: new Date().toLocaleString()
  });
  
  updateActivityDisplay();
  checkAchievements();
  updateScore();
  
  document.getElementById('minutes').value = '';
  showAlert(`${workType} logged! +${stepsAdded} steps`, 'success');
}

function updateActivityDisplay() {
  document.getElementById('steps').innerText = state.steps;
  document.getElementById('stepDisplay').innerText = state.steps;
  document.getElementById('stepBar').style.width = Math.min((state.steps / 8000) * 100, 100) + '%';
  
  const logEl = document.getElementById('activityLog');
  if(state.activities.length === 0) {
    logEl.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px">No activities logged yet</p>';
  } else {
    logEl.innerHTML = state.activities.slice(-5).reverse().map(a => 
      `<div class="tip-card">
        <strong>${a.type}</strong>
        ${a.duration} mins • ${a.steps} steps<br>
        <span style="font-size:11px;color:#94a3b8">${a.time}</span>
      </div>`
    ).join('');
  }
}

// ===== HEALTH ANALYSIS =====
function analyzeHealth() {
  if(!state.userProfile.height || !state.userProfile.weight || !state.userProfile.age) {
    showAlert('Please complete your profile first', 'error');
    navigateTo('profile');
    return;
  }
  
  const h = state.userProfile.height / 100;
  const w = state.userProfile.weight;
  const age = state.userProfile.age;
  const gender = state.userProfile.gender;
  
  const bmi = (w / (h * h)).toFixed(1);
  
  let category, risk;
  if(bmi < 18.5) {
    category = 'Underweight';
    risk = 'Moderate';
  } else if(bmi < 25) {
    category = 'Normal';
    risk = 'Low';
  } else if(bmi < 30) {
    category = 'Overweight';
    risk = 'Moderate';
  } else {
    category = 'Obese';
    risk = 'High';
  }
  
  let bmr;
  if(gender === 'Male') {
    bmr = Math.round(10 * w + 6.25 * state.userProfile.height - 5 * age + 5);
  } else {
    bmr = Math.round(10 * w + 6.25 * state.userProfile.height - 5 * age - 161);
  }
  
  document.getElementById('bmiValue').innerText = bmi;
  document.getElementById('bmiCategory').innerText = category;
  document.getElementById('bmrValue').innerText = bmr + ' kcal';
  document.getElementById('riskLevel').innerText = risk;
  document.getElementById('healthResults').style.display = 'block';
  
  document.getElementById('recommendedCal').innerText = bmr + ' kcal';
  document.getElementById('bmrDisplay').style.display = 'flex';
}

function analyzeCycle() {
  const periodStart = document.getElementById('periodStart').value;
  const cycleLength = parseInt(document.getElementById('cycleLength').value) || 28;
  
  if(!periodStart) {
    showAlert('Please enter last period start date', 'error');
    return;
  }
  
  const startDate = new Date(periodStart);
  const nextPeriod = new Date(startDate);
  nextPeriod.setDate(startDate.getDate() + cycleLength);
  
  const ovulation = new Date(startDate);
  ovulation.setDate(startDate.getDate() + cycleLength - 14);
  
  const fertileStart = new Date(ovulation);
  fertileStart.setDate(ovulation.getDate() - 3);
  
  const fertileEnd = new Date(ovulation);
  fertileEnd.setDate(ovulation.getDate() + 2);
  
  const today = new Date();
  const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const currentDay = (daysSinceStart % cycleLength) + 1;
  
  let phase, phaseAdvice;
  if(currentDay <= 5) {
    phase = 'Menstrual Phase';
    phaseAdvice = 'Rest, gentle movement, iron-rich foods, stay hydrated';
  } else if(currentDay <= 14) {
    phase = 'Follicular Phase';
    phaseAdvice = 'High energy period - great for intense workouts and new challenges';
  } else if(currentDay <= 18) {
    phase = 'Ovulation Phase';
    phaseAdvice = 'Peak energy and mood - social activities and communication excel';
  } else {
    phase = 'Luteal Phase';
    phaseAdvice = 'Energy may decrease - focus on self-care, reduce caffeine, increase magnesium';
  }
  
  document.getElementById('nextPeriod').innerText = nextPeriod.toDateString();
  document.getElementById('fertileWindow').innerText = 
    `${fertileStart.toDateString()} - ${fertileEnd.toDateString()}`;
  document.getElementById('pmsPhase').innerText = phase;
  document.getElementById('cycleAdvice').innerText = phaseAdvice;
  document.getElementById('cycleResults').style.display = 'block';
  
  document.getElementById('cycleInfo').innerText = `Next Period: ${nextPeriod.toDateString()}`;
  document.getElementById('phaseInfo').innerText = `Current Phase: ${phase}`;
  
  showAlert('Cycle analysis complete!', 'success');
}

// ===== NUTRITION =====
function addCalories() {
  const calories = parseInt(document.getElementById('meal').value);
  
  if(!calories || calories <= 0) {
    showAlert('Please enter valid calories!', 'error');
    return;
  }
  
  state.calories += calories;
  document.getElementById('cal').innerText = state.calories;
  document.getElementById('calDisplay').innerText = state.calories + ' kcal';
  document.getElementById('meal').value = '';
  
  updateScore();
  showAlert(`${calories} calories added!`, 'success');
}

function drinkWater() {
  if(state.water < 8) {
    state.water++;
    updateWaterDisplay();
    checkAchievements();
    updateScore();
    showAlert('Water logged! Keep hydrating!', 'success');
  } else {
    showAlert('Daily water goal achieved! 🎉', 'success');
  }
}

function updateWaterDisplay() {
  document.getElementById('water').innerText = state.water;
  document.getElementById('waterDisplay').innerText = state.water + '/8';
  document.getElementById('waterBar').style.width = (state.water / 8 * 100) + '%';
  document.getElementById('mainWater').innerText = state.water;
}

// ===== MOOD TRACKING =====
function logMood() {
  const mood = document.getElementById('moodSel').value;
  const timestamp = new Date().toLocaleString();
  
  state.moods.push({ mood, timestamp });
  
  document.getElementById('moodOut').innerText = mood;
  
  const logEl = document.getElementById('moodLog');
  if(state.moods.length > 0) {
    logEl.innerHTML = `
      <h4 style="color:var(--accent2);margin-bottom:12px">Recent Moods</h4>
      ${state.moods.slice(-5).reverse().map(m => 
        `<div class="tip-card">
          <strong>${m.mood}</strong>
          <span style="font-size:11px;color:#94a3b8">${m.timestamp}</span>
        </div>`
      ).join('')}
    `;
  }
  
  updateMoodInsight();
  checkAchievements();
  updateScore();
  showAlert('Mood logged successfully!', 'success');
}

function updateMoodInsight() {
  const insightEl = document.getElementById('moodInsight');
  
  if(state.moods.length === 0) {
    insightEl.innerText = 'Start tracking your moods to see insights about your emotional patterns.';
    return;
  }
  
  const recentMoods = state.moods.slice(-7).map(m => m.mood);
  const positives = recentMoods.filter(m => m.includes('Happy') || m.includes('Calm') || m.includes('Motivated') || m.includes('Focused') || m.includes('Energetic')).length;
  const negatives = recentMoods.filter(m => m.includes('Stressed') || m.includes('Anxious') || m.includes('Sad') || m.includes('Tired')).length;
  
  let insight = `You've logged ${state.moods.length} mood entries. `;
  
  if(positives > negatives) {
    insight += 'Your recent moods have been mostly positive! Keep up the great work with your wellness routine. 🌟';
  } else if(negatives > positives) {
    insight += 'You seem to be experiencing some challenging emotions. Consider talking to someone, practicing self-care, or seeking professional support if needed. 💚';
  } else {
    insight += 'Your moods have been balanced. Continue monitoring your emotional wellbeing. 🧘';
  }
  
  insightEl.innerText = insight;
}

// ===== QUIZ =====
function startQuiz() {
  state.quizIndex = 0;
  state.quizScore = 0;
  showQuestion();
}

function showQuestion() {
  if(state.quizIndex >= quizData.length) return;
  
  const current = quizData[state.quizIndex];
  document.getElementById('q').innerText = current.q;
  document.getElementById('qNum').innerText = 
    `Question ${state.quizIndex + 1} of ${quizData.length}`;
  document.getElementById('quizOut').innerHTML = '';
}

function answer(userAnswer) {
  if(state.quizIndex >= quizData.length) return;
  
  const correct = quizData[state.quizIndex].a;
  
  if(userAnswer === correct) {
    state.quizScore++;
  }
  
  state.quizIndex++;
  
  if(state.quizIndex >= quizData.length) {
    const percentage = Math.round((state.quizScore / quizData.length) * 100);
    document.getElementById('quizOut').innerHTML = `
      <div class="alert success">
        <h3>🎉 Quiz Complete!</h3>
        <p style="font-size:24px;margin:12px 0">${state.quizScore}/${quizData.length}</p>
        <p>Score: ${percentage}%</p>
        <p style="margin-top:12px">${percentage >= 70 ? 
          'Excellent! You have great health knowledge! 🌟' : 
          percentage >= 50 ? 
          'Good job! Keep learning about health and wellness! 💪' : 
          'Keep exploring health topics to improve your knowledge! 📚'}</p>
      </div>
    `;
    document.getElementById('qNum').innerText = 'Quiz Complete!';
    document.getElementById('q').innerText = '';
    
    checkAchievements();
  } else {
    showQuestion();
  }
}

// ===== ACHIEVEMENTS =====
function checkAchievements() {
  const badges = [];
  
  if(state.steps >= 6000 && !state.earnedBadges.has('active')) {
    badges.push('🚶 Active Champ');
    state.earnedBadges.add('active');
  }
  
  if(state.water >= 8 && !state.earnedBadges.has('hydration')) {
    badges.push('💧 Hydration Hero');
    state.earnedBadges.add('hydration');
  }
  
  if(state.moods.length >= 5 && !state.earnedBadges.has('emotion')) {
    badges.push('💖 Emotion Aware');
    state.earnedBadges.add('emotion');
  }
  
  if(state.quizScore >= 14 && !state.earnedBadges.has('mental')) {
    badges.push('🧠 Mental Master');
    state.earnedBadges.add('mental');
  }
  
  if(state.activities.length >= 10 && !state.earnedBadges.has('fitness')) {
    badges.push('🏃 Fitness Enthusiast');
    state.earnedBadges.add('fitness');
  }
  
  const score = calculateScore();
  if(score >= 80 && !state.earnedBadges.has('wellness')) {
    badges.push('🌟 Wellness Warrior');
    state.earnedBadges.add('wellness');
  }
  
  if(badges.length > 0) {
    badges.forEach(b => addBadge(b));
  }
}

function addBadge(badgeName) {
  const badgesEl = document.getElementById('badges');
  badgesEl.innerHTML += `<span class="badge">${badgeName}</span>`;
  document.getElementById('noBadges').style.display = 'none';
}

// ===== SCORE CALCULATION =====
function calculateScore() {
  let score = 0;
  
  score += Math.min(state.steps / 150, 40);
  score += state.water * 5;
  score += Math.min(state.calories / 120, 20);
  score += state.moods.length * 3;
  score += state.activities.length * 2;
  
  return Math.min(Math.round(score), 100);
}

function updateScore() {
  const score = calculateScore();
  document.getElementById('score').innerText = score;
  document.getElementById('scoreBar').style.width = score + '%';
  updateMainStats();
  checkAchievements();
}

function updateMainStats() {
  document.getElementById('mainScore').innerText = calculateScore();
  document.getElementById('mainSteps').innerText = state.steps;
  document.getElementById('mainWater').innerText = state.water;
}

// ===== HEALTH TIPS =====
function getHealthTips() {
  if(!state.userProfile.age) {
    document.getElementById('aiGuidance').innerHTML = 
      '<div class="alert">Please complete your profile first!</div>';
    return;
  }
  
  const allTips = [
    '🏃 <strong>Movement:</strong> Even 10-minute walks boost mood and energy significantly.',
    '💤 <strong>Sleep:</strong> Maintain consistent sleep/wake times for better rest quality.',
    '🧘 <strong>Stress:</strong> 5-min breathing (inhale-4, hold-4, exhale-6) calms nervous system.',
    '🥗 <strong>Nutrition:</strong> Eat rainbow colors - different nutrients in each color.',
    '💪 <strong>Strength:</strong> 2-3 weekly sessions improve bone density and metabolism.',
    '🧠 <strong>Mental Health:</strong> Journaling helps process emotions and reduce anxiety.',
    '⏰ <strong>Meal Timing:</strong> Last meal 3h before bed for better digestion and sleep.',
    '🚰 <strong>Hydration:</strong> Water before meals aids digestion and portion control.',
    '🌞 <strong>Sunlight:</strong> 15-20 minutes daily boosts vitamin D and mood.',
    '🎵 <strong>Music:</strong> Listening to favorite music can reduce stress hormones.',
    '👥 <strong>Social:</strong> Regular social connections improve mental and physical health.',
    '📵 <strong>Digital Detox:</strong> Screen-free time improves sleep and reduces eye strain.'
  ];
  
  const selected = [];
  const indices = new Set();
  while(indices.size < 4 && indices.size < allTips.length) {
    indices.add(Math.floor(Math.random() * allTips.length));
  }
  indices.forEach(i => selected.push(allTips[i]));
  
  document.getElementById('aiGuidance').innerHTML = 
    selected.map(tip => `<div class="tip-card">${tip}</div>`).join('');
}

// ===== ALERTS =====
function showAlert(message, type) {
  type = type || 'success';
  
  const alertDiv = document.createElement('div');
  alertDiv.className = type === 'success' ? 'alert success' : 'alert';
  alertDiv.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;min-width:280px;max-width:90%;animation:fadeIn 0.3s;-webkit-animation:fadeIn 0.3s';
  
  const messageP = document.createElement('p');
  messageP.style.margin = '0';
  messageP.textContent = message;
  alertDiv.appendChild(messageP);
  
  document.body.appendChild(alertDiv);
  
  setTimeout(function() {
    alertDiv.style.opacity = '0';
    alertDiv.style.transition = 'opacity 0.3s ease';
    setTimeout(function() {
      if(alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 300);
  }, 3000);
}

// ===== INITIALIZATION =====
window.addEventListener('load', function() {
  const cachedWeather = getCachedWeather();
  if (cachedWeather) {
    state.weather = cachedWeather;
    displayWeatherInfo();
  }
  
  loadDailyGuidance();
  updateActivityDisplay();
  updateWaterDisplay();
  
  if('ontouchstart' in window) {
    document.body.classList.add('touch-device');
  }
  
  document.addEventListener('visibilitychange', function() {
    if(!document.hidden) {
      updateMainStats();
    }
  });
});

let lastTap = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if(now - lastTap < 300) {
    e.preventDefault();
  }
  lastTap = now;
});
