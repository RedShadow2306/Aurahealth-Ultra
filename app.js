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
let chatHistory = [];
function safeWeatherAccess(weather, property, defaultValue = null) {
  if (!weather || weather[property] === null || weather[property] === undefined) {
    return defaultValue;
  }
  return weather[property];
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
  const profile = window.state?.userProfile || {};
const stateData = window.state || {
  steps: 0,
  water: 0,
  calories: 0,
  activities: [],
  moods: [],
  earnedBadges: new Set()
};
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
	  // Add this helper function at the top
function safeWeatherAccess(weather, property, defaultValue = null) {
  if (!weather || weather[property] === null || weather[property] === undefined) {
    return defaultValue;
  }
  return weather[property];
}

// Then use it like this:
const temp = safeWeatherAccess(weather, 'temp');
if (temp !== null) {
  // Use temp safely
}
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
