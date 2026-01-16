import { useState } from "react";
import { motion } from "framer-motion";
import { Cloud, Search, MapPin, Droplets, Wind, Thermometer } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import { toast } from "sonner";

interface WeatherData {
  name: string;
  country: string;
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  temp_min: number;
  temp_max: number;
}

const Weather = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      toast.error("Please enter a city name");
      return;
    }

    setLoading(true);

    try {
      // Using Open-Meteo (free, no API key needed) with geocoding
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        toast.error("City not found");
        setLoading(false);
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const weatherData = await weatherRes.json();

      const current = weatherData.current;
      const daily = weatherData.daily;

      // Map weather codes to descriptions
      const weatherDescriptions: Record<number, { description: string; icon: string }> = {
        0: { description: "Clear sky", icon: "☀️" },
        1: { description: "Mainly clear", icon: "🌤️" },
        2: { description: "Partly cloudy", icon: "⛅" },
        3: { description: "Overcast", icon: "☁️" },
        45: { description: "Foggy", icon: "🌫️" },
        48: { description: "Rime fog", icon: "🌫️" },
        51: { description: "Light drizzle", icon: "🌧️" },
        53: { description: "Moderate drizzle", icon: "🌧️" },
        55: { description: "Dense drizzle", icon: "🌧️" },
        61: { description: "Slight rain", icon: "🌧️" },
        63: { description: "Moderate rain", icon: "🌧️" },
        65: { description: "Heavy rain", icon: "🌧️" },
        71: { description: "Slight snow", icon: "🌨️" },
        73: { description: "Moderate snow", icon: "🌨️" },
        75: { description: "Heavy snow", icon: "❄️" },
        95: { description: "Thunderstorm", icon: "⛈️" },
      };

      const weatherInfo = weatherDescriptions[current.weather_code] || {
        description: "Unknown",
        icon: "🌡️",
      };

      setWeather({
        name,
        country,
        temp: Math.round(current.temperature_2m),
        feels_like: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        wind_speed: Math.round(current.wind_speed_10m),
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        temp_min: Math.round(daily.temperature_2m_min[0]),
        temp_max: Math.round(daily.temperature_2m_max[0]),
      });
    } catch (error) {
      console.error("Weather error:", error);
      toast.error("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Weather"
          description="Get real-time weather information for any location"
          icon={Cloud}
          color="--tool-weather"
        />

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8"
          >
            {/* Search Form */}
            <form onSubmit={fetchWeather} className="mb-8">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name..."
                    className="w-full input-dark pl-12"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-gradient flex items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--tool-weather)) 0%, hsl(45 100% 40%) 100%)",
                  }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Search
                </button>
              </div>
            </form>

            {/* Weather Display */}
            {weather && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">
                    {weather.name}, {weather.country}
                  </h2>
                  <p className="text-muted-foreground capitalize">{weather.description}</p>
                </div>

                <div className="text-8xl mb-6">{weather.icon}</div>

                <div className="text-6xl font-bold mb-2">{weather.temp}°C</div>
                <p className="text-muted-foreground mb-8">
                  H: {weather.temp_max}° L: {weather.temp_min}°
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <Thermometer className="w-6 h-6 mx-auto mb-2 text-tool-weather" />
                    <p className="text-sm text-muted-foreground">Feels Like</p>
                    <p className="font-semibold">{weather.feels_like}°C</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <Droplets className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-sm text-muted-foreground">Humidity</p>
                    <p className="font-semibold">{weather.humidity}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <Wind className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                    <p className="text-sm text-muted-foreground">Wind</p>
                    <p className="font-semibold">{weather.wind_speed} km/h</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!weather && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Cloud className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Search for a city to see the weather</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Weather;
