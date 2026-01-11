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

// ===== CHATBOT WITH CLEAR RESPONSES =====
var chatHistory = [];

// ===== GENERATE RESPONSE =====
function generateResponse(userMessage) {
  var msg = userMessage.toLowerCase().trim();
  var profile = state.userProfile || {};
  var score = calculateScore();
  
  // GREETINGS
  if (msg.match(/^(hi|hello|hey|sup|yo)/)) {
    return "👋 Hi " + (profile.name || "there") + "! How can I help you with your health today?\n\n💡 Try asking:\n• Should I exercise?\n• Am I hydrated?\n• How's my score?\n• What should I eat?";
  }
  
  // EXERCISE
  if (msg.includes('exercise') || msg.includes('workout') || msg.includes('train')) {
    var response = "💪 EXERCISE ADVICE\n\n";
    response += "📊 Your current steps: " + state.steps + "/8000\n\n";
    
    if (state.steps < 3000) {
      response += "⚠️ Low activity today! Time to move!\n\n";
    } else if (state.steps < 6000) {
      response += "✅ Good progress - keep going!\n\n";
    } else {
      response += "🔥 Excellent! You're crushing it!\n\n";
    }
    
    if (profile.age && profile.age < 30) {
      response += "Recommended (Age " + profile.age + "):\n• 30-45 min HIIT or running\n• Strength training 3-4x/week\n• High-intensity activities";
    } else if (profile.age && profile.age < 50) {
      response += "Recommended (Age " + profile.age + "):\n• 30-40 min brisk walking\n• Moderate cardio 3x/week\n• Mix cardio + flexibility";
    } else if (profile.age) {
      response += "Recommended (Age " + profile.age + "):\n• 20-30 min light walking\n• Gentle yoga/stretching\n• Balance exercises";
    } else {
      response += "Recommended:\n• 30 minutes moderate exercise\n• Complete your profile for personalized advice!";
    }
    
    var weather = getCachedWeather();
    if (weather && weather.temp !== null) {
      response += "\n\n🌤️ WEATHER UPDATE:";
      if (weather.temp > 35) {
        response += "\n⚠️ " + weather.temp + "°C - TOO HOT!\n→ Exercise indoors or wait until evening";
      } else if (weather.temp < 10) {
        response += "\n❄️ " + weather.temp + "°C - Cold!\n→ Warm up indoors first, layer up";
      } else {
        response += "\n✅ " + weather.temp + "°C - Perfect for outdoor activity!";
      }
    }
    
    return response;
  }
  
  // WATER
  if (msg.includes('water') || msg.includes('hydrat') || msg.includes('drink')) {
    var response = "💧 HYDRATION STATUS\n\n";
    var remaining = 8 - state.water;
    
    response += "📊 Current: " + state.water + "/8 glasses\n";
    response += "🎯 Goal: 8 glasses (2 liters)\n\n";
    
    if (state.water === 0) {
      response += "❌ NO WATER LOGGED TODAY!\n\n";
      response += "⚠️ You're dehydrated!\n";
      response += "→ Drink 2 glasses RIGHT NOW\n";
      response += "→ Set hourly reminders";
    } else if (state.water < 4) {
      response += "⚠️ BELOW TARGET!\n\n";
      response += "You need " + remaining + " more glasses\n";
      response += "→ Drink 1 glass every hour\n";
      response += "→ Keep water bottle visible";
    } else if (state.water < 8) {
      response += "✅ GOOD PROGRESS!\n\n";
      response += "Just " + remaining + " more to go!\n";
      response += "→ You're almost there!";
    } else {
      response += "🎉 GOAL ACHIEVED!\n\n";
      response += "Perfect hydration today!\n";
      response += "→ Keep up the great work!";
    }
    
    var weather = getCachedWeather();
    if (weather && weather.temp > 30) {
      response += "\n\n🌡️ Hot weather (" + weather.temp + "°C)\n→ Drink 10-12 glasses today!";
    }
    
    return response;
  }
  
  // MOOD
  if (msg.includes('mood') || msg.includes('feel') || msg.includes('emotion')) {
    if (state.moods.length === 0) {
      return "🧠 MOOD TRACKING\n\n❌ No moods logged yet!\n\n→ Go to the Mood page\n→ Start tracking daily\n→ Understand your patterns\n\nTracking emotions helps identify triggers and improve mental wellness!";
    }
    
    var response = "🧠 MOOD ANALYSIS\n\n";
    var latest = state.moods[state.moods.length - 1].mood;
    response += "📊 Latest mood: " + latest + "\n";
    response += "📅 Total entries: " + state.moods.length + "\n\n";
    
    var recent = state.moods.slice(-7);
    var positive = 0;
    var negative = 0;
    
    recent.forEach(function(m) {
      if (m.mood.includes('Happy') || m.mood.includes('Calm') || m.mood.includes('Motivated') || m.mood.includes('Energetic')) {
        positive++;
      } else if (m.mood.includes('Stressed') || m.mood.includes('Anxious') || m.mood.includes('Sad') || m.mood.includes('Tired')) {
        negative++;
      }
    });
    
    response += "📈 Recent trend:\n";
    response += "✅ Positive: " + positive + "\n";
    response += "⚠️ Challenging: " + negative + "\n\n";
    
    if (positive > negative) {
      response += "🌟 GREAT NEWS!\n→ Your mood is mostly positive\n→ Keep up your routine!";
    } else if (negative > positive) {
      response += "💚 NEED SUPPORT?\n\nTry these:\n• 10-min meditation\n• Talk to a friend\n• Take a walk\n• Deep breathing\n\n💡 Consider professional help if needed";
    } else {
      response += "⚖️ BALANCED\n→ Continue tracking\n→ Identify patterns";
    }
    
    return response;
  }
  
  // SCORE
  if (msg.includes('score') || msg.includes('progress') || msg.includes('doing')) {
    var response = "📊 WELLNESS SCORE REPORT\n\n";
    response += "🎯 Current Score: " + score + "/100\n\n";
    
    if (score >= 80) {
      response += "🌟 EXCELLENT!\n→ You're a wellness warrior!\n→ Keep crushing it!\n\n";
    } else if (score >= 60) {
      response += "💪 GOOD JOB!\n→ You're on track\n→ Push to 80+ for excellence!\n\n";
    } else if (score >= 40) {
      response += "📈 FAIR - Room to improve!\n\n";
    } else {
      response += "⚠️ NEEDS ATTENTION!\n\n";
    }
    
    response += "📋 Breakdown:\n";
    response += "👣 Steps: " + state.steps + "/8000 " + (state.steps >= 6000 ? "✅" : "⚠️") + "\n";
    response += "💧 Water: " + state.water + "/8 " + (state.water >= 8 ? "✅" : "⚠️") + "\n";
    response += "🔥 Calories: " + state.calories + " kcal\n";
    response += "🏃 Activities: " + state.activities.length + "\n";
    response += "😊 Moods: " + state.moods.length + "\n\n";
    
    response += "🎯 TO IMPROVE:\n";
    if (state.steps < 6000) response += "→ Walk more (+" + (6000 - state.steps) + " steps)\n";
    if (state.water < 8) response += "→ Drink more water (+" + (8 - state.water) + " glasses)\n";
    if (state.moods.length < 5) response += "→ Track mood daily\n";
    if (state.activities.length < 10) response += "→ Log more activities\n";
    
    return response;
  }
  
  // NUTRITION
  if (msg.includes('eat') || msg.includes('food') || msg.includes('diet') || msg.includes('nutrition')) {
    if (!profile.height || !profile.weight) {
      return "🍎 NUTRITION ADVICE\n\n❌ Profile incomplete!\n\n→ Go to Profile page\n→ Add height & weight\n→ Get personalized diet plan\n\nI need your stats to calculate BMI and give proper advice!";
    }
    
    var h = profile.height / 100;
    var bmi = (profile.weight / (h * h)).toFixed(1);
    var response = "🍎 PERSONALIZED NUTRITION PLAN\n\n";
    response += "📊 Your BMI: " + bmi + "\n";
    
    if (bmi < 18.5) {
      response += "📉 Category: Underweight\n\n";
      response += "🎯 GOAL: Gain weight healthily\n\n";
      response += "✅ EAT MORE:\n";
      response += "• Protein-rich (eggs, chicken, fish, lentils)\n";
      response += "• Healthy fats (nuts, avocado, olive oil)\n";
      response += "• Calorie-dense foods\n";
      response += "• 5-6 small meals daily\n\n";
      response += "💪 COMBINE WITH:\n";
      response += "• Strength training\n";
      response += "• Muscle building exercises";
    } else if (bmi < 25) {
      response += "✅ Category: Healthy Weight!\n\n";
      response += "🎯 GOAL: Maintain current weight\n\n";
      response += "✅ BALANCED DIET:\n";
      response += "• Protein, carbs, healthy fats\n";
      response += "• Plenty of vegetables & fruits\n";
      response += "• 8+ glasses water daily\n";
      response += "• Limit processed foods\n\n";
      response += "💪 STAY ACTIVE:\n";
      response += "• Regular exercise\n";
      response += "• Active lifestyle";
    } else if (bmi < 30) {
      response += "📈 Category: Overweight\n\n";
      response += "🎯 GOAL: Healthy weight loss\n\n";
      response += "✅ DIET PLAN:\n";
      response += "• Calorie deficit (300-500 kcal/day)\n";
      response += "• High protein, high fiber\n";
      response += "• Reduce sugar & processed foods\n";
      response += "• Portion control important\n\n";
      response += "💪 EXERCISE:\n";
      response += "• 30-45 min daily\n";
      response += "• Cardio + strength training\n\n";
      response += "📉 Expected: -2kg per month";
    } else {
      response += "⚠️ Category: Obese\n\n";
      response += "🎯 GOAL: Significant weight loss\n\n";
      response += "❗ IMPORTANT:\n";
      response += "• Consult a nutritionist\n";
      response += "• Medical supervision recommended\n\n";
      response += "✅ IMMEDIATE STEPS:\n";
      response += "• Focus on whole foods\n";
      response += "• Eliminate sugary drinks\n";
      response += "• Start with walking\n";
      response += "• Track every meal\n\n";
      response += "💡 Small changes lead to big results!";
    }
    
    if (state.calories > 0) {
      response += "\n\n📊 Today's intake: " + state.calories + " kcal";
    }
    
    return response;
  }
  
  // MOTIVATION
  if (msg.includes('motivat') || msg.includes('inspire') || msg.includes('lazy') || msg.includes('give up')) {
    var quotes = [
      "💪 YOU'VE GOT THIS!\n\nEvery step forward counts. You're at " + score + "/100 - let's push to 80+!\n\n🔥 Remember: Progress > Perfection",
      "🌟 DON'T GIVE UP NOW!\n\n" + (profile.name || "You") + ", you're stronger than you think!\n\n💯 Consistency beats talent every time!",
      "⚡ KEEP PUSHING!\n\nYou've logged:\n• " + state.steps + " steps\n• " + state.water + " glasses water\n• " + state.activities.length + " activities\n\nThat's dedication! 🏆",
      "🔥 YOUR FUTURE SELF WILL THANK YOU!\n\nGoal: " + (profile.goal || "Wellness") + "\n\nEvery healthy choice today = Better tomorrow!\n\n💪 Let's do this!",
      "🌈 PROGRESS CHECK:\n\nFrom 0 to " + score + "/100!\n\nYou're building momentum!\n\n🎯 Small wins = Big victories!"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  
  // SUMMARY
  if (msg.includes('summary') || msg.includes('report') || msg.includes('today') || msg.includes('overview')) {
    var response = "📋 DAILY SUMMARY";
    if (profile.name) response += " - " + profile.name;
    response += "\n\n";
    
    response += "📊 TODAY'S STATS:\n";
    response += "👣 Steps: " + state.steps + "/8000 " + (state.steps >= 8000 ? "✅" : "❌") + "\n";
    response += "💧 Water: " + state.water + "/8 " + (state.water >= 8 ? "✅" : "❌") + "\n";
    response += "🔥 Calories: " + state.calories + " kcal\n";
    response += "🏃 Activities: " + state.activities.length + "\n";
    response += "😊 Mood: " + (state.moods.length > 0 ? state.moods[state.moods.length - 1].mood : "Not logged") + "\n";
    response += "🏆 Badges: " + state.earnedBadges.size + "/6\n\n";
    
    response += "📈 WELLNESS SCORE: " + score + "/100\n\n";
    
    if (score >= 80) {
      response += "🌟 VERDICT: Excellent day!\n→ Keep this momentum!";
    } else if (score >= 60) {
      response += "💪 VERDICT: Good progress!\n→ Push for 80+ tomorrow!";
    } else {
      response += "⚡ VERDICT: Room to improve!\n→ Small steps = Big changes!";
    }
    
    return response;
  }
  
  // HELP
  if (msg.includes('help') || msg.includes('what can') || msg.includes('commands')) {
    return "🤖 AI ASSISTANT - COMMANDS\n\n💪 EXERCISE\n'Should I exercise?', 'Workout advice'\n\n💧 HYDRATION\n'Am I hydrated?', 'Water check'\n\n📊 PROGRESS\n'How's my score?', 'Summary'\n\n🍎 NUTRITION\n'What should I eat?', 'Diet plan'\n\n🧠 MOOD\n'Analyze my mood', 'How am I feeling?'\n\n🔥 MOTIVATION\n'Motivate me!', 'Inspire me'\n\n💡 Just ask naturally - I understand!";
  }
  
  // DEFAULT
  return "🤔 HMMMM...\n\nI didn't quite understand that.\n\n💡 TRY ASKING:\n• Should I exercise?\n• Am I drinking enough water?\n• How's my wellness score?\n• What should I eat?\n• Analyze my mood\n• Motivate me!\n\nOr type 'help' for all commands!";
}

// ===== SEND MESSAGE =====
function sendMessage() {
  var input = document.getElementById('userMessage');
  if (!input) {
    alert("ERROR: Chat input not found! Check HTML.");
    return;
  }
  
  var message = input.value.trim();
  if (!message) {
    showAlert('Please type a message first!', 'error');
    return;
  }
  
  // Show user message
  addChatMessage('user', message);
  input.value = '';
  input.focus();
  
  // Show "typing..." indicator
  var chatDiv = document.getElementById('chatHistory');
  var typingDiv = document.createElement('div');
  typingDiv.id = 'typingIndicator';
  typingDiv.style.cssText = 'background:rgba(78,205,196,0.1);padding:12px;border-radius:12px;margin-bottom:12px;font-style:italic;color:#4ecdc4';
  typingDiv.innerHTML = '🤖 Assistant is typing...';
  chatDiv.appendChild(typingDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
  
  // Generate response after delay
  setTimeout(function() {
    // Remove typing indicator
    var typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
    
    // Show bot response
    var response = generateResponse(message);
    addChatMessage('bot', response);
  }, 800);
}

// ===== QUICK QUESTION =====
function quickQuestion(question) {
  var input = document.getElementById('userMessage');
  if (input) {
    input.value = question;
    sendMessage();
  }
}

// ===== ADD MESSAGE TO CHAT =====
function addChatMessage(sender, message) {
  var chatDiv = document.getElementById('chatHistory');
  if (!chatDiv) {
    alert("ERROR: Chat display not found!");
    return;
  }
  
  var isUser = sender === 'user';
  var messageDiv = document.createElement('div');
  
  messageDiv.style.cssText = 'background:' + (isUser ? 'rgba(255,107,157,0.25)' : 'rgba(78,205,196,0.25)') + ';' +
    'padding:16px;' +
    'border-radius:12px;' +
    'margin-bottom:12px;' +
    'animation:fadeIn 0.3s ease;' +
    'border-left:4px solid ' + (isUser ? 'var(--accent)' : 'var(--accent2)');
  
  var header = document.createElement('strong');
  header.style.cssText = 'color:' + (isUser ? 'var(--accent)' : 'var(--accent2)') + ';font-size:15px;display:block;margin-bottom:8px';
  header.textContent = isUser ? '👤 You' : '🤖 AI Assistant';
  
  var content = document.createElement('div');
  content.style.cssText = 'color:#f0f4f8;font-size:14px;line-height:1.6;white-space:pre-wrap';
  content.textContent = message;
  
  messageDiv.appendChild(header);
  messageDiv.appendChild(content);
  chatDiv.appendChild(messageDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
  
  chatHistory.push({
    sender: sender,
    message: message,
    time: new Date().toLocaleString()
  });
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
  
  // Keyboard shortcut for chat
  setTimeout(function() {
    var textarea = document.getElementById('userMessage');
    if (textarea) {
      textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      console.log("✅ Chatbot ready! Type a message or click a button.");
    }
  }, 1000);
});

// Touch event handler
let lastTap = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if(now - lastTap < 300) {
    e.preventDefault();
  }
  lastTap = now;
});

console.log("✅ AuraHealth Ultra loaded successfully!");
\// ===== SAFETY CHECK FOR MISSING FUNCTIONS =====
if (typeof navigateTo === 'undefined') {
  window.navigateTo = function(page) {
    console.warn('navigateTo called but not implemented for:', page);
  };
}
// ===== CHATBOT UI MANAGEMENT =====
function toggleChatbot() {
  const panel = document.getElementById('chatbotPanel');
  const icon = document.getElementById('chatbotIcon');
  
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    icon.style.display = 'flex';
  } else {
    panel.classList.add('open');
    icon.style.display = 'none';
    
    // Focus input when opening
    setTimeout(() => {
      const input = document.getElementById('userMessage');
      if (input) input.focus();
    }, 400);
  }
}

// ===== CHATBOT INTENT ENGINE =====
function detectIntent(message) {
  const msg = message.toLowerCase().trim();
  
  // Intent patterns with priority order
  const intents = [
    // GREETING
    { pattern: /^(hi|hello|hey|sup|yo|hola|namaste)\b/i, intent: 'greeting' },
    
    // EXERCISE & ACTIVITY
    { pattern: /(exercise|workout|train|activity|should i (walk|run|gym))/i, intent: 'exercise' },
    
    // HYDRATION
    { pattern: /(water|hydrat|drink|thirsty)/i, intent: 'hydration' },
    
    // MOOD & MENTAL HEALTH
    { pattern: /(mood|feel|emotion|mental|stress|anxious|happy|sad)/i, intent: 'mood' },
    
    // WELLNESS SCORE
    { pattern: /(score|progress|doing|performance|how am i)/i, intent: 'score' },
    
    // NUTRITION & DIET
    { pattern: /(eat|food|diet|nutrition|meal|calor|hungry)/i, intent: 'nutrition' },
    
    // MOTIVATION
    { pattern: /(motivat|inspire|lazy|give up|tired|can't|discourage)/i, intent: 'motivation' },
    
    // SUMMARY
    { pattern: /(summary|report|today|overview|status)/i, intent: 'summary' },
    
    // BMI/HEALTH ANALYSIS
    { pattern: /(bmi|bmr|weight|health analysis|body|fat)/i, intent: 'health' },
    
    // SLEEP
    { pattern: /(sleep|rest|tired|insomnia|bed)/i, intent: 'sleep' },
    
    // WEATHER IMPACT
    { pattern: /(weather|temperature|hot|cold|rain)/i, intent: 'weather' },
    
    // HELP
    { pattern: /(help|what can|commands|guide|how to use)/i, intent: 'help' }
  ];
  
  for (const { pattern, intent } of intents) {
    if (pattern.test(msg)) {
      return intent;
    }
  }
  
  return 'unknown';
}

// ===== CHATBOT RESPONSE GENERATOR =====
function generateChatbotResponse(userMessage) {
  const intent = detectIntent(userMessage);
  const profile = state.userProfile || {};
  const score = calculateScore();
  const timeOfDay = getTimeOfDay();
  const weather = getCachedWeather();
  
  // Response builders by intent
  const responses = {
    greeting: () => {
      let response = `👋 Hi ${profile.name || "there"}! I'm your offline health assistant.\n\n`;
      response += `It's ${timeOfDay.toLowerCase()}`;
      if (weather && weather.temp !== null) {
        response += ` and ${weather.temp}°C outside`;
      }
      response += `.\n\n💡 How can I help you today?\n\n`;
      response += `Try asking:\n`;
      response += `• "Summarize my health"\n`;
      response += `• "Should I exercise?"\n`;
      response += `• "Am I hydrated?"\n`;
      response += `• "What should I eat?"`;
      return response;
    },
    
    exercise: () => {
      let response = `💪 EXERCISE GUIDANCE\n\n`;
      response += `📊 Your activity today:\n`;
      response += `👣 Steps: ${state.steps.toLocaleString()}/8,000\n`;
      response += `🏃 Activities logged: ${state.activities.length}\n\n`;
      
      // Activity assessment
      if (state.steps < 2000) {
        response += `⚠️ VERY LOW ACTIVITY!\nYou need to move urgently.\n\n`;
      } else if (state.steps < 6000) {
        response += `📈 Good start, but you can do more!\n\n`;
      } else if (state.steps >= 8000) {
        response += `🔥 EXCELLENT! You've hit your goal!\n\n`;
      } else {
        response += `✅ Almost there! Just ${8000 - state.steps} steps to go!\n\n`;
      }
      
      // Personalized recommendations
      if (profile.age) {
        response += `🎯 Recommended for age ${profile.age}:\n`;
        if (profile.age < 30) {
          response += `• 30-45 min HIIT or running\n• High-intensity workouts\n• Strength training 4x/week\n\n`;
        } else if (profile.age < 50) {
          response += `• 30-40 min brisk walking/jogging\n• Moderate cardio 3-4x/week\n• Mix strength + flexibility\n\n`;
        } else {
          response += `• 20-30 min gentle walking\n• Yoga and stretching\n• Balance exercises\n\n`;
        }
      }
      
      // Weather-based advice
      if (weather && weather.temp !== null) {
        const temp = weather.temp;
        const condition = categorizeWeather(weather.condition);
        
        response += `🌤️ WEATHER IMPACT (${temp}°C):\n`;
        
        if (temp > 35) {
          response += `🥵 EXTREME HEAT WARNING!\n→ Exercise indoors only\n→ Drink water every 15 min\n→ Best time: 6-8 AM or after 7 PM\n`;
        } else if (temp > 30) {
          response += `☀️ Hot weather - be cautious!\n→ Exercise early morning (6-9 AM)\n→ Stay hydrated (extra 2-3 glasses)\n→ Wear light clothes\n`;
        } else if (temp < 10) {
          response += `❄️ Cold weather tips:\n→ Warm up indoors first (10 min)\n→ Layer clothing\n→ Protect extremities\n`;
        } else if (temp >= 20 && temp <= 28) {
          response += `✅ Perfect weather for outdoor exercise!\n→ Great conditions for any activity\n`;
        }
        
        if (condition === 'rain') {
          response += `\n🌧️ Rainy conditions:\n→ Indoor workouts recommended\n→ Try home cardio or yoga\n`;
        } else if (condition === 'extreme') {
          response += `\n⚠️ Severe weather alert!\n→ Stay indoors for safety\n→ Do indoor exercises only\n`;
        }
      }
      
      // Time-based advice
      response += `\n⏰ Time consideration:\n`;
      if (timeOfDay === 'Morning') {
        response += `Perfect for high-energy workouts!\nYour body is ready for activity.`;
      } else if (timeOfDay === 'Afternoon') {
        response += `Peak performance time!\nStrength and endurance are highest.`;
      } else if (timeOfDay === 'Evening') {
        response += `Good for moderate exercise.\nAvoid intense workouts 3h before bed.`;
      } else {
        response += `Late for intense exercise.\nOpt for gentle stretching or yoga.`;
      }
      
      return response;
    },
    
    hydration: () => {
      let response = `💧 HYDRATION ANALYSIS\n\n`;
      const remaining = 8 - state.water;
      const percentage = Math.round((state.water / 8) * 100);
      
      response += `📊 Current status:\n`;
      response += `${state.water}/8 glasses (${percentage}%)\n\n`;
      
      if (state.water === 0) {
        response += `🚨 CRITICAL - NO WATER LOGGED!\n\n`;
        response += `⚠️ Dehydration risks:\n`;
        response += `• Headaches and fatigue\n`;
        response += `• Poor concentration\n`;
        response += `• Reduced metabolism\n\n`;
        response += `🎯 IMMEDIATE ACTION:\n`;
        response += `→ Drink 2 glasses RIGHT NOW\n`;
        response += `→ Set hourly phone reminders\n`;
        response += `→ Keep water bottle visible\n`;
      } else if (state.water < 4) {
        response += `⚠️ BELOW TARGET - Risk of dehydration\n\n`;
        response += `You need ${remaining} more glasses (${remaining * 250}ml)\n\n`;
        response += `💡 Quick tips:\n`;
        response += `→ Drink 1 glass every hour\n`;
        response += `→ Have water before meals\n`;
        response += `→ Carry water bottle everywhere\n`;
      } else if (state.water < 8) {
        response += `✅ GOOD PROGRESS!\n\nJust ${remaining} more glass${remaining > 1 ? 'es' : ''} to reach your goal!\n\n`;
        response += `Keep up the great work! 💪\n`;
      } else {
        response += `🎉 GOAL ACHIEVED!\n\nPerfect hydration today!\n\n`;
        response += `✓ Well hydrated\n`;
        response += `✓ Optimal metabolism\n`;
        response += `✓ Better skin health\n`;
      }
      
      // Weather adjustments
if (weather && weather.temp !== null && weather.temp !== undefined) {
  response += `\n🌡️ Weather adjustment:\n`;
  if (weather.temp > 30) {
          response += `Hot weather (${weather.temp}°C) - Increase to 10-12 glasses!\nYou lose more water through sweat.`;
        } else if (weather.temp < 15) {
          response += `Cold weather (${weather.temp}°C) - Still drink 8 glasses.\nCold reduces thirst but you still need water.`;
        }
      }
      
      // Benefits reminder
      if (state.water < 8) {
        response += `\n\n💎 Benefits of proper hydration:\n`;
        response += `✓ Clearer skin\n`;
        response += `✓ Better digestion\n`;
        response += `✓ More energy\n`;
        response += `✓ Improved focus\n`;
        response += `✓ Weight management\n`;
      }
      
      return response;
    },
    
    mood: () => {
  if (!state.moods || state.moods.length === 0) {
    return `🧠 MOOD TRACKING\n\n❌ No mood entries yet!\n\nStart tracking to:\n✓ Understand emotional patterns\n✓ Identify triggers\n✓ Improve mental wellness\n✓ Track progress over time\n\n→ Go to Mood page to log your first entry!\n\n💡 Tip: Track mood 2-3 times daily for best insights.`;
  }
  
  let response = `🧠 EMOTIONAL WELLNESS ANALYSIS\n\n`;
  const latest = state.moods[state.moods.length - 1];
  if (!latest) {
    return `🧠 MOOD TRACKING\n\n❌ Unable to read mood data. Please try logging a new mood entry.`;
  }
      response += `📊 Latest: ${latest.mood}\n`;
      response += `📅 Total entries: ${state.moods.length}\n`;
      response += `🕐 Last logged: ${new Date(latest.timestamp).toLocaleString()}\n\n`;
      
      // Analyze recent trends (last 7 entries)
      const recent = state.moods.slice(-7);
      let positive = 0, negative = 0, neutral = 0;
      
      recent.forEach(m => {
        const mood = m.mood.toLowerCase();
        if (mood.includes('happy') || mood.includes('calm') || mood.includes('motivated') || mood.includes('energetic') || mood.includes('focused')) {
          positive++;
        } else if (mood.includes('stressed') || mood.includes('anxious') || mood.includes('sad') || mood.includes('tired')) {
          negative++;
        } else {
          neutral++;
        }
      });
      
      response += `📈 Recent trend (last ${recent.length} entries):\n`;
      response += `✅ Positive moods: ${positive}\n`;
      response += `⚠️ Challenging moods: ${negative}\n`;
      response += `😐 Neutral moods: ${neutral}\n\n`;
      
      // Personalized insights
      if (positive > negative * 2) {
        response += `🌟 EXCELLENT MENTAL STATE!\n\nYour emotional wellness is thriving!\n\n`;
        response += `Keep doing what you're doing:\n`;
        response += `✓ Maintain your routines\n`;
        response += `✓ Continue healthy habits\n`;
        response += `✓ Share positivity with others\n`;
      } else if (positive > negative) {
        response += `💚 GOOD EMOTIONAL BALANCE\n\nYou're managing well overall.\n\n`;
        response += `To improve further:\n`;
        response += `→ Practice daily gratitude\n`;
        response += `→ 10-min meditation\n`;
        response += `→ Regular physical activity\n`;
      } else if (negative > positive) {
        response += `💙 NEED EXTRA CARE\n\nYou seem to be facing challenges.\n\n`;
        response += `🆘 Immediate support:\n`;
        response += `→ Talk to a trusted friend/family\n`;
        response += `→ Practice deep breathing (5 min)\n`;
        response += `→ Take a short walk outside\n`;
        response += `→ Journal your thoughts\n\n`;
        response += `⚠️ If feelings persist, consider professional help:\n`;
        response += `• Therapist or counselor\n`;
        response += `• Mental health helpline\n`;
        response += `• Your doctor\n`;
      }
      
      // Pattern detection
      if (state.moods.length >= 5) {
        response += `\n🔍 Pattern insights:\n`;
        if (negative >= 3 && recent.length >= 5) {
          response += `⚠️ Multiple challenging moods detected.\nConsider stress management techniques.`;
        } else if (positive >= 5) {
          response += `✨ Consistent positive trend - great job!`;
        }
      }
      
      return response;
    },
    
    score: () => {
      let response = `📊 WELLNESS SCORE REPORT\n\n`;
      response += `🎯 Current Score: ${score}/100\n\n`;
      
      // Score interpretation
      if (score >= 80) {
        response += `🌟 EXCELLENT - Wellness Warrior!\n\nYou're crushing your health goals!\n\n`;
      } else if (score >= 60) {
        response += `💪 GOOD - You're on the right track!\n\nPush to 80+ for excellence!\n\n`;
      } else if (score >= 40) {
        response += `📈 FAIR - Room for improvement\n\nFocus on consistency!\n\n`;
      } else {
        response += `⚠️ NEEDS ATTENTION - Let's improve together!\n\nSmall steps lead to big changes!\n\n`;
      }
      
      // Detailed breakdown
      response += `📋 Today's breakdown:\n\n`;
      
      const stepScore = Math.min(state.steps / 150, 40);
      const waterScore = state.water * 5;
      const calScore = Math.min(state.calories / 120, 20);
      const moodScore = state.moods.length * 3;
      const activityScore = state.activities.length * 2;
      
      response += `👣 Steps: ${state.steps}/8,000 ${state.steps >= 8000 ? '✅' : '❌'}\n`;
      response += `   Contributing: ${Math.round(stepScore)} points\n\n`;
      
      response += `💧 Water: ${state.water}/8 glasses ${state.water >= 8 ? '✅' : '❌'}\n`;
      response += `   Contributing: ${Math.round(waterScore)} points\n\n`;
      
      response += `🔥 Calories: ${state.calories} kcal\n`;
      response += `   Contributing: ${Math.round(calScore)} points\n\n`;
      
      response += `😊 Mood tracking: ${state.moods.length} entries\n`;
      response += `   Contributing: ${Math.round(moodScore)} points\n\n`;
      
      response += `🏃 Activities: ${state.activities.length} logged\n`;
      response += `   Contributing: ${Math.round(activityScore)} points\n\n`;
      
      // Improvement suggestions
      response += `🎯 TO BOOST YOUR SCORE:\n`;
      const suggestions = [];
      
      if (state.steps < 8000) {
        const needed = 8000 - state.steps;
        suggestions.push(`→ Walk ${needed.toLocaleString()} more steps (+${Math.round((needed / 150) * 10)} points)`);
      }
      if (state.water < 8) {
        suggestions.push(`→ Drink ${8 - state.water} more glasses (+${(8 - state.water) * 5} points)`);
      }
      if (state.moods.length < 5) {
        suggestions.push(`→ Track mood regularly (+${(5 - state.moods.length) * 3} points potential)`);
      }
      if (state.activities.length < 10) {
        suggestions.push(`→ Log more activities (+${(10 - state.activities.length) * 2} points potential)`);
      }
      
      if (suggestions.length > 0) {
        response += suggestions.join('\n');
      } else {
        response += `✅ You're doing great across all metrics!`;
      }
      
      // Badges progress
      response += `\n\n🏆 Achievements: ${state.earnedBadges.size}/6 badges\n`;
      if (state.earnedBadges.size < 6) {
        response += `Keep working to unlock all badges!`;
      }
      
      return response;
    },
    
    nutrition: () => {
      if (!profile.height || !profile.weight) {
        return `🍎 NUTRITION GUIDANCE\n\n❌ Profile incomplete!\n\nI need your height and weight to provide personalized nutrition advice.\n\n→ Go to Profile page\n→ Complete your details\n→ Get customized diet recommendations!\n\n💡 Accurate measurements = Better advice`;
      }
      
      const h = profile.height / 100;
      const bmi = (profile.weight / (h * h)).toFixed(1);
      let response = `🍎 PERSONALIZED NUTRITION PLAN\n\n`;
      
      response += `📊 Your stats:\n`;
      response += `Height: ${profile.height} cm\n`;
      response += `Weight: ${profile.weight} kg\n`;
      response += `BMI: ${bmi}\n\n`;
      
      // BMI-based recommendations
      let category, advice;
      
      if (bmi < 18.5) {
        category = '📉 Underweight';
        advice = {
          goal: 'Healthy weight gain',
          calories: 'Increase by 300-500 kcal/day',
          foods: [
            '🥚 Protein-rich: eggs, chicken, fish, paneer, lentils',
            '🥑 Healthy fats: nuts, avocado, olive oil, ghee',
            '🍚 Complex carbs: oats, brown rice, quinoa, sweet potato',
            '🥛 Dairy: full-fat milk, yogurt, cheese'
          ],
          meals: 'Eat 5-6 small meals throughout the day',
          extra: '💪 Combine with strength training to build muscle, not just fat'
        };
      } else if (bmi < 25) {
        category = '✅ Healthy Weight';
        advice = {
          goal: 'Maintain current weight',
          calories: 'Maintain current intake',
          foods: [
            '🥗 Balanced plate: 50% vegetables, 25% protein, 25% carbs',
            '🍎 Plenty of fruits and vegetables (5+ servings)',
            '🐟 Lean proteins: fish, chicken, legumes, tofu',
            '🌾 Whole grains: brown rice, quinoa, whole wheat'
          ],
          meals: '3 main meals + 2 healthy snacks',
          extra: '✅ You\'re doing great! Keep up the balanced approach'
        };
      } else if (bmi < 30) {
        category = '📈 Overweight';
        advice = {
          goal: 'Gradual, healthy weight loss',
          calories: 'Reduce by 300-500 kcal/day (safe deficit)',
          foods: [
            '🥬 High fiber: vegetables, fruits, whole grains',
            '🍗 Lean protein: chicken breast, fish, eggs, legumes',
            '💧 Plenty of water (helps reduce hunger)',
            '🚫 Limit: sugar, processed foods, fried items'
          ],
          meals: '3 balanced meals, avoid late-night eating',
          extra: '📉 Target: 0.5-1 kg per week (safe and sustainable)'
        };
      } else {
		category = '⚠️ Obese';
		advice = {
goal: 'Significant lifestyle change needed',
calories: 'Consult nutritionist for personalized plan',
foods: [
'🥗 Focus on whole, unprocessed foods',
'🚫 Eliminate: sugary drinks, fast food, excessive oil',
'🥦 Load up on vegetables (unlimited)',
'💧 Water before each meal'
],
meals: 'Structured meal planning essential',
extra: '⚠️ Strongly recommend consulting a healthcare professional'
};
}
response += `${category}\n\n`;
  response += `🎯 GOAL: ${advice.goal}\n`;
  response += `📊 Calories: ${advice.calories}\n\n`;
  response += `✅ RECOMMENDED FOODS:\n`;
  advice.foods.forEach(food => response += `${food}\n`);
  response += `\n📅 Meal pattern: ${advice.meals}\n`;
  response += `\n💡 ${advice.extra}\n`;
  
  // Today's intake
  if (state.calories > 0) {
    response += `\n📊 Today's intake: ${state.calories} kcal logged`;
  }
  
  // Weather-based additions
  if (weather && weather.temp !== null) {
    response += `\n\n🌡️ Weather consideration:\n`;
    if (weather.temp > 30) {
      response += `Hot weather (${weather.temp}°C):\n→ Eat light, hydrating foods\n→ Cucumber, watermelon, coconut water\n→ Avoid heavy, oily meals`;
    } else if (weather.temp < 15) {
      response += `Cold weather (${weather.temp}°C):\n→ Warm soups and stews\n→ Ginger tea, warm milk\n→ Include warming spices`;
    }
  }
  
  // Time-based advice
  response += `\n\n⏰ Timing tip (${timeOfDay}):\n`;
  if (timeOfDay === 'Morning') {
    response += `Eat protein-rich breakfast within 2 hours of waking.\nBoosts metabolism for the day!`;
  } else if (timeOfDay === 'Afternoon') {
    response += `Lunch should be your largest meal.\nYou have time to burn these calories!`;
  } else if (timeOfDay === 'Evening') {
    response += `Light dinner, 3 hours before bed.\nAids digestion and better sleep.`;
  } else {
    response += `Avoid eating now if possible.\nLate meals disrupt sleep and digestion.`;
  }
  
  return response;
},

motivation: () => {
  const quotes = [
    {
      title: '💪 YOU\'RE STRONGER THAN YOU THINK!',
      message: `${profile.name || 'Friend'}, look at what you've achieved:\n\n✅ Wellness score: ${score}/100\n✅ Steps today: ${state.steps.toLocaleString()}\n✅ Activities: ${state.activities.length}\n✅ Badges earned: ${state.earnedBadges.size}\n\nThat's REAL progress! 🔥\n\nEvery small step counts. Keep pushing forward!`
    },
    {
      title: '🌟 YOUR FUTURE SELF WILL THANK YOU',
      message: `Every healthy choice today is an investment in your tomorrow.\n\nYour goal: ${profile.goal || 'Better health'}\n\nYou're not just building a body, you're building:\n• Discipline\n• Consistency  \n• Mental strength\n• A better life\n\n💎 You've got this! Keep going!`
    },
    {
      title: '🔥 PROGRESS OVER PERFECTION',
      message: `${profile.name || 'You'}, forget perfect.\n\nYou're at ${score}/100 wellness score.\n\nThat's ${score}% better than doing nothing!\n\n📈 Small wins:\n→ Tracked ${state.moods.length} moods\n→ Logged ${state.activities.length} activities\n→ ${state.water} glasses of water\n\nEVERY. SINGLE. ACTION. COUNTS. 💪`
    },
    {
      title: '⚡ DON\'T QUIT ON A BAD DAY',
      message: `Feeling tired? That's normal!\n\nBut remember why you started:\n🎯 ${profile.goal || 'To be healthier'}\n\nYou've already:\n✓ Taken ${state.steps.toLocaleString()} steps\n✓ Earned ${state.earnedBadges.size} badges\n✓ Showed up today\n\nBad days don't erase good progress.\n\nRest, recharge, and come back stronger! 💚`
    },
    {
      title: '🎯 CONSISTENCY BEATS TALENT',
      message: `${profile.name || 'Champion'}, you know what separates winners from dreamers?\n\nSHOWING UP.\n\nYou're here. That's 80% of success.\n\nYour score: ${score}/100\nYour potential: Unlimited 🚀\n\nKeep showing up, even on hard days.\nEspecially on hard days.\n\nYOU are building something incredible! 🌟`
    }
  ];
  
  const selected = quotes[Math.floor(Math.random() * quotes.length)];
  return `${selected.title}\n\n${selected.message}`;
},

summary: () => {
  let response = `📋 COMPLETE DAILY REPORT\n`;
  if (profile.name) response += `for ${profile.name}\n`;
  response += `\n${new Date().toLocaleDateString()} - ${timeOfDay}\n\n`;
  
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `📊 WELLNESS OVERVIEW\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  response += `🎯 Overall Score: ${score}/100 `;
  if (score >= 80) response += `🌟\n`;
  else if (score >= 60) response += `💪\n`;
  else if (score >= 40) response += `📈\n`;
  else response += `⚠️\n`;
  
  response += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  response += `📈 TODAY'S METRICS\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  response += `👣 Steps: ${state.steps.toLocaleString()}/8,000 `;
  response += state.steps >= 8000 ? `✅\n` : state.steps >= 6000 ? `🟡\n` : `❌\n`;
  
  response += `💧 Hydration: ${state.water}/8 glasses `;
  response += state.water >= 8 ? `✅\n` : state.water >= 5 ? `🟡\n` : `❌\n`;
  
  response += `🔥 Calories: ${state.calories} kcal\n`;
  
  response += `🏃 Activities: ${state.activities.length} logged\n`;
  
  response += `😊 Mood: ${state.moods.length > 0 ? state.moods[state.moods.length - 1].mood : 'Not tracked'}\n`;
  
  response += `🏆 Achievements: ${state.earnedBadges.size}/6 badges\n`;
  
  // Weather info
  if (weather && weather.temp !== null) {
    response += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    response += `🌤️ WEATHER CONDITIONS\n`;
    response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    response += `📍 ${weather.location || 'Your area'}\n`;
    response += `🌡️ Temperature: ${weather.temp}°C (feels like ${weather.feelsLike}°C)\n`;
    response += `💨 Condition: ${weather.description}\n`;
    response += `💧 Humidity: ${weather.humidity}%\n`;
  }
  
  // Performance verdict
  response += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  response += `📊 PERFORMANCE VERDICT\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (score >= 80) {
    response += `🌟 OUTSTANDING!\nYou're a wellness champion!\n\n→ Maintain this momentum\n→ You're inspiring!`;
  } else if (score >= 60) {
    response += `💪 SOLID PERFORMANCE!\nYou're on the right path!\n\n→ Push to 80+ tomorrow\n→ You're capable of excellence!`;
  } else if (score >= 40) {
    response += `📈 ROOM FOR GROWTH\nYou can do better!\n\n→ Focus on consistency\n→ Small improvements daily`;
  } else {
    response += `⚡ TIME TO STEP UP!\nYou have unlimited potential!\n\n→ Start with one goal today\n→ Build momentum gradually`;
  }
  
  return response;
},

health: () => {
  if (!profile.height || !profile.weight || !profile.age) {
    return `🩺 HEALTH ANALYSIS\n\n❌ Insufficient data!\n\nComplete your profile to get:\n✓ BMI calculation\n✓ BMR (calorie needs)\n✓ Health risk assessment\n✓ Personalized recommendations\n\n→ Go to Profile page now!`;
  }
  
  const h = profile.height / 100;
  const w = profile.weight;
  const bmi = (w / (h * h)).toFixed(1);
  
  let category, risk, advice;
  if (bmi < 18.5) {
    category = 'Underweight';
    risk = 'Moderate';
    advice = 'Focus on healthy weight gain through balanced nutrition and strength training.';
  } else if (bmi < 25) {
    category = 'Healthy Weight';
    risk = 'Low';
    advice = 'Excellent! Maintain current lifestyle with regular exercise and balanced diet.';
  } else if (bmi < 30) {
    category = 'Overweight';
    risk = 'Moderate';
    advice = 'Consider gradual weight loss through calorie deficit and increased activity.';
  } else {
    category = 'Obese';
    risk = 'High';
    advice = 'Consult healthcare professional. Significant lifestyle changes recommended.';
  }
  
  // BMR calculation
  let bmr;
  if (profile.gender === 'Male') {
    bmr = Math.round(10 * w + 6.25 * profile.height - 5 * profile.age + 5);
  } else {
    bmr = Math.round(10 * w + 6.25 * profile.height - 5 * profile.age - 161);
  }
  
  let response = `🩺 COMPREHENSIVE HEALTH ANALYSIS\n\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `📊 YOUR METRICS\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  response += `👤 Age: ${profile.age} years\n`;
  response += `⚖️ Weight: ${profile.weight} kg\n`;
  response += `📏 Height: ${profile.height} cm\n`;
  response += `🚻 Gender: ${profile.gender}\n\n`;
  
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `🔬 HEALTH INDICATORS\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  response += `📐 BMI: ${bmi}\n`;
  response += `📊 Category: ${category}\n`;
  response += `🔥 BMR: ${bmr} kcal/day\n`;
  response += `⚠️ Health Risk: ${risk}\n\n`;
  
  response += `💡 MEDICAL ADVICE:\n${advice}\n\n`;
  
  // Calorie recommendations
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `🍽️ DAILY CALORIE NEEDS\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  response += `🛋️ Sedentary: ${Math.round(bmr * 1.2)} kcal\n`;
  response += `🚶 Light activity: ${Math.round(bmr * 1.375)} kcal\n`;
  response += `🏃 Moderate activity: ${Math.round(bmr * 1.55)} kcal\n`;
  response += `💪 Very active: ${Math.round(bmr * 1.725)} kcal\n\n`;
  
  // Health condition specific
  if (profile.healthIssue && profile.healthIssue !== 'None') {
    response += `━━━━━━━━━━━━━━━━━━━━\n`;
    response += `🩺 CONDITION MANAGEMENT\n`;
    response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    response += `Diagnosed: ${profile.healthIssue}\n\n`;
    
    const conditionAdvice = {
      'BP': 'Monitor regularly, limit sodium, manage stress, take prescribed medication.',
      'Diabetes': 'Check blood sugar, follow meal plan, regular exercise, medication compliance.',
      'PCOS': 'Regular exercise, weight management, balanced diet, stress reduction.',
      'Thyroid': 'Medication adherence, regular check-ups, monitor symptoms.',
      'Asthma': 'Avoid triggers, breathing exercises, keep inhaler accessible.',
      'Heart': 'Heart-healthy diet, moderate exercise, stress management, regular check-ups.'
    };
    
    if (conditionAdvice[profile.healthIssue]) {
      response += `⚠️ Important:\n${conditionAdvice[profile.healthIssue]}`;
    }
  }
  
  return response;
},

sleep: () => {
  let response = `😴 SLEEP & RECOVERY GUIDANCE\n\n`;
  
  response += `⏰ Current time: ${timeOfDay}\n\n`;
  
  if (timeOfDay === 'Night') {
    response += `🌙 BEDTIME OPTIMIZATION\n\n`;
    response += `For quality sleep tonight:\n\n`;
    response += `✅ DO:\n`;
    response += `→ Turn off screens NOW\n`;
    response += `→ Dim lights, cool room (18-20°C)\n`;
    response += `→ Read or listen to calm music\n`;
    response += `→ Consistent bedtime (aim same time)\n`;
    response += `→ Empty bladder before bed\n\n`;
    response += `❌ AVOID:\n`;
    response += `→ Phone/tablet/TV (blue light)\n`;
    response += `→ Heavy meals or caffeine\n`;
    response += `→ Intense exercise\n`;
    response += `→ Stressful conversations\n`;
    response += `→ Bright lights\n\n`;
    response += `🎯 Target: 7-8 hours sleep\n`;
    response += `💡 Better sleep = Better recovery = Better performance tomorrow!`;
  } else if (timeOfDay === 'Morning') {
    response += `☀️ MORNING SLEEP HABITS\n\n`;
    response += `Did you sleep well?\n\n`;
    response += `✅ Good sleep indicators:\n`;
    response += `→ Woke up feeling refreshed\n`;
    response += `→ Minimal tossing/turning\n`;
    response += `→ Dreamed (REM sleep occurred)\n`;
    response += `→ Woke naturally without alarm\n\n`;
    response += `📈 To improve TONIGHT:\n`;
    response += `→ Exercise earlier in day\n`;
    response += `→ Limit caffeine after 2 PM\n`;
    response += `→ No screens 1h before bed\n`;
    response += `→ Keep room cool and dark\n`;
  } else {
    response += `💤 DAILY SLEEP PREPARATION\n\n`;
    response += `Start preparing for good sleep NOW:\n\n`;
    response += `→ Avoid caffeine after 3 PM\n`;
    response += `→ Get some physical activity (boosts sleep quality)\n`;
    response += `→ Reduce stress with breaks\n`;
    response += `→ Eat light dinner (3h before bed)\n\n`;
    response += `🎯 Aim for consistent sleep schedule\n`;
    response += `Quality sleep = Better mood + More energy + Improved health`;
  }
  
  // Recovery advice based on activity
  if (state.activities.length > 0) {
    response += `\n\n🔄 RECOVERY STATUS:\n`;
    response += `You logged ${state.activities.length} activities today.\n`;
    if (state.activities.length >= 3) {
      response += `\n⚠️ High activity level!\n`;
      response += `Extra sleep needed for muscle recovery.\n`;
      response += `Target: 8-9 hours tonight.`;
    } else {
      response += `\nModerate activity - 7-8 hours sleep is perfect.`;
    }
  }
  
  return response;
},

weather: () => {
  if (!weather || weather.temp === null) {
    return `🌤️ WEATHER INFORMATION\n\n❌ No weather data available!\n\n→ Go to home page\n→ Enter your pincode\n→ Get weather-specific health tips!\n\n🌡️ Weather affects:\n✓ Exercise recommendations\n✓ Hydration needs\n✓ Nutrition suggestions\n✓ Safety alerts`;
  }
  
  let response = `🌤️ WEATHER-BASED HEALTH GUIDANCE\n\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `📍 CURRENT CONDITIONS\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  response += `📍 Location: ${weather.location || 'Your area'}\n`;
  response += `🌡️ Temperature: ${weather.temp}°C\n`;
  response += `🤔 Feels like: ${weather.feelsLike}°C\n`;
  response += `☁️ Condition: ${weather.description}\n`;
  response += `💧 Humidity: ${weather.humidity}%\n\n`;
  
  const temp = weather.temp;
  const tempCat = categorizeTemperature(temp);
  const weatherType = categorizeWeather(weather.condition);
  
  response += `━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 HEALTH RECOMMENDATIONS\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Exercise advice
  response += `🏃 EXERCISE:\n`;
  if (temp > 35) {
    response += `🚨 EXTREME HEAT - DO NOT exercise outdoors!\n`;
    response += `→ Indoor activities only\n`;
    response += `→ Air-conditioned environment\n`;
    response += `→ Drink water every 15 min\n`;
  } else if (temp > 30) {
    response += `☀️ Very hot - Be cautious\n`;
    response += `→ Exercise before 9 AM or after 6 PM\n`;
    response += `→ Stay in shade\n`;
    response += `→ Wear light, breathable clothes\n`;
    response += `→ Extra hydration crucial\n`;
  } else if (temp < 10) {
    response += `❄️ Cold conditions\n`;
    response += `→ Warm up indoors (10 min)\n`;
    response += `→ Layer clothing\n`;
    response += `→ Protect extremities\n`;
    response += `→ Breathe through nose\n`;
  } else if (temp >= 20 && temp <= 28) {
    response += `✅ PERFECT conditions!\n`;
    response += `→ Ideal for all outdoor activities\n`;
    response += `→ Make the most of it!\n`;
  }
  
  if (weatherType === 'rain') {
    response += `\n🌧️ Rainy weather:\n`;
    response += `→ Indoor workouts recommended\n`;
    response += `→ Home cardio, yoga, or gym\n`;
  } else if (weatherType === 'extreme') {
    response += `\n⚠️ SEVERE WEATHER ALERT!\n`;
    response += `→ STAY INDOORS\n`;
    response += `→ Safety is priority\n`;
  }
  
  // Hydration advice
  response += `\n\n💧 HYDRATION:\n`;
  if (temp > 30) {
    response += `Hot weather - Increase to 10-12 glasses!\n`;
    response += `→ Drink before feeling thirsty\n`;
    response += `→ Add electrolytes if sweating heavily\n`;
  } else if (temp < 15) {
    response += `Cold weather - Still drink 8 glasses\n`;
    response += `→ Warm water/herbal tea counts\n`;
    response += `→ Don't let cold reduce intake\n`;
  } else {
    response += `Moderate weather - 8 glasses target\n`;
  }
  
if (weather.humidity !== null && weather.humidity !== undefined && weather.humidity > 70) {
  response += `\nHigh humidity (${weather.humidity}%):\n`;
    response += `→ You'll sweat more\n`;
    response += `→ Drink extra fluids\n`;
  }
  
  // Nutrition advice
  response += `\n\n🍽️ NUTRITION:\n`;
  if (temp > 28) {
    response += `Light, cooling foods:\n`;
    response += `→ Cucumber, watermelon, coconut water\n`;
    response += `→ Fresh salads, yogurt, mint\n`;
    response += `→ Avoid heavy, oily foods\n`;
  } else if (temp < 18) {
    response += `Warming, comfort foods:\n`;
    response += `→ Soups, stews, warm beverages\n`;
    response += `→ Ginger tea, warm milk\n`;
    response += `→ Vitamin C for immunity\n`;
  }
  
  return response;
},

help: () => {
  return `🤖 OFFLINE HEALTH ASSISTANT GUIDE\n\n━━━━━━━━━━━━━━━━━━━━\n💬 WHAT I CAN DO\n━━━━━━━━━━━━━━━━━━━━\n\nI analyze your health data OFFLINE to provide personalized guidance.\n\n🔒 PRIVACY: All analysis happens in your browser. Your data NEVER leaves your device.\n\n━━━━━━━━━━━━━━━━━━━━\n📋 ASK ME ABOUT:\n━━━━━━━━━━━━━━━━━━━━\n\n💪 EXERCISE & ACTIVITY\n"Should I exercise?"\n"Is it safe to workout?"\n"Exercise recommendations"\n\n💧 HYDRATION\n"Am I drinking enough water?"\n"Hydration status"\n"Water reminder"\n\n📊 WELLNESS SCORE\n"How's my score?"\n"Explain my progress"\n"What to improve?"\n\n🍎 NUTRITION\n"What should I eat?"\n"Diet recommendations"\n"Am I eating right?"\n\n🧠 MENTAL HEALTH\n"Analyze my mood"\n"How am I feeling?"\n"Mood patterns"\n\n📋 DAILY SUMMARY\n"Summarize my health"\n"Today's report"\n"Overall status"\n\n🌤️ WEATHER IMPACT\n"How does weather affect me?"\n"Weather recommendations"\n\n🔥 MOTIVATION\n"Motivate me!"\n"I'm feeling lazy"\n"Inspire me"\n\n━━━━━━━━━━━━━━━━━━━━\n💡 TIPS\n━━━━━━━━━━━━━━━━━━━━\n\n✓ Ask naturally - I understand context\n✓ Use quick action buttons for common queries\n✓ The more data you log, the better my advice\n✓ I consider time, weather, and your profile\n\n━━━━━━━━━━━━━━━━━━━━\n🔒 YOUR PRIVACY\n━━━━━━━━━━━━━━━━━━━━\n\n✅ 100% offline operation\n✅ No AI APIs or cloud services\n✅ Data stays on YOUR device\n✅ No tracking or data collection\n\nYou're in complete control! 💚`;
},

unknown: () => {
  return `🤔 I'm not quite sure what you're asking.\n\n💡 Try questions like:\n\n📊 "How's my wellness score?"\n💪 "Should I exercise now?"\n💧 "Am I drinking enough water?"\n🍎 "What should I eat today?"\n🧠 "Analyze my mood patterns"\n📋 "Give me a daily summary"\n🔥 "Motivate me!"\n\n━━━━━━━━━━━━━━━━━━━━\n\nOr type "help" to see all available commands!\n\n🤖 I'm learning to help you better. Try rephrasing your question or use the quick action buttons above.`;
}
};
// Return appropriate response
return responses[intent] ? responses[intent]() : responses.unknown();}
// ===== CHATBOT UI FUNCTIONS =====
function sendMessage() {
const input = document.getElementById('userMessage');
if (!input) return;
const message = input.value.trim();
if (!message) {
showAlert('Please type a message!', 'error');
return;
}
// Clear input
input.value = '';
// Add user message to chat
addChatMessage('user', message);
// Show typing indicator
const chatDiv = document.getElementById('chatHistory');
const typingDiv = document.createElement('div');
typingDiv.id = 'typingIndicator';
typingDiv.style.cssText = 'background:rgba(78,205,196,0.15);padding:14px;border-radius:12px;margin-bottom:12px;font-style:italic;color:#4ecdc4;font-size:13px;';
typingDiv.innerHTML = '🤖 Analyzing your data...';
chatDiv.appendChild(typingDiv);
chatDiv.scrollTop = chatDiv.scrollHeight;
// Generate response with realistic delay
setTimeout(() => {
  // Remove typing indicator
  const typing = document.getElementById('typingIndicator');
  if (typing) typing.remove();
  
  // Generate and show bot response
  try {
    const response = generateChatbotResponse(message);
    addChatMessage('bot', response);
  } catch (error) {
    console.error('Chatbot error:', error);
    addChatMessage('bot', '❌ Sorry, I encountered an error analyzing your data. Please try again or check that your profile is complete.');
  }
}, 600 + Math.random() * 400); // Random delay 600-1000ms for realism
}
function quickQuestion(question) {
const input = document.getElementById('userMessage');
if (input) {
input.value = question;
sendMessage();
}
}
function addChatMessage(sender, message) {
const chatDiv = document.getElementById('chatHistory');
if (!chatDiv) return;
const isUser = sender === 'user';
const messageDiv = document.createElement('div');
messageDiv.style.cssText = `
  background: ${isUser ? 'rgba(255,107,157,0.2)' : 'rgba(78,205,196,0.2)'};
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  animation: fadeIn 0.3s ease;
  border-left: 4px solid ${isUser ? 'var(--accent)' : 'var(--accent2)'};
`;
const header = document.createElement('strong');
header.style.cssText = `
  color: ${isUser ? 'var(--accent)' : 'var(--accent2)'};
  font-size: 14px;
  display: block;
  margin-bottom: 8px;
`;
header.textContent = isUser ? '👤 You' : '🤖 Health Assistant';
const content = document.createElement('div');
content.style.cssText = 'color:#f0f4f8;font-size:14px;line-height:1.7;white-space:pre-wrap;word-wrap:break-word;';
content.textContent = message;
messageDiv.appendChild(header);
messageDiv.appendChild(content);
chatDiv.appendChild(messageDiv);
// Auto-scroll to bottom
chatDiv.scrollTop = chatDiv.scrollHeight;
// Store in history
chatHistory.push({
sender: sender,
message: message,
time: new Date().toISOString()
});
}
// ===== CHATBOT INITIALIZATION =====
window.addEventListener('load', function() {
// Setup enter key for chat
setTimeout(() => {
const textarea = document.getElementById('userMessage');
if (textarea) {
textarea.addEventListener('keydown', function(e) {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
sendMessage();
}
});
}
}, 500);
});
