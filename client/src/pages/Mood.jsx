import { useEffect, useState } from "react";
import { api } from "../api";
import { Smile, TrendingUp, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const moodOptions = [
  { value: 'good', label: 'Good', emoji: '😊', color: 'bg-green-100 text-green-700 border-green-200', selected: 'bg-green-500 text-white' },
  { value: 'neutral', label: 'Okay', emoji: '😐', color: 'bg-amber-100 text-amber-700 border-amber-200', selected: 'bg-amber-500 text-white' },
  { value: 'bad', label: 'Not Great', emoji: '😔', color: 'bg-red-100 text-red-700 border-red-200', selected: 'bg-red-500 text-white' }
];

export default function Mood() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  
  const load = () => {
    api.get("/mood/today").then(res => setToday(res.data));
    api.get("/mood").then(res => setHistory(res.data.slice(0, 7))).catch(() => {});
  };
  
  useEffect(() => { load(); }, []);

  const setMood = async (mood) => {
    try {
      await api.post("/mood", { mood });
      load();
      const moodEmoji = moodOptions.find(m => m.value === mood)?.emoji || '';
      toast.success(`Mood updated! ${moodEmoji}`);
    } catch (err) {
      toast.error("Failed to update mood");
    }
  };

  const currentMood = today?.mood ? moodOptions.find(m => m.value === today.mood) : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mood Tracker</h1>
        <p className="text-gray-600 mt-1">How are you feeling today?</p>
      </div>

      {/* Current Mood Selection */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Smile className="w-5 h-5 mr-2 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Today's Mood</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {moodOptions.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setMood(mood.value)}
              className={`p-6 rounded-xl border-2 transition-all ${
                currentMood?.value === mood.value
                  ? `${mood.selected} border-transparent shadow-md`
                  : `${mood.color} hover:border-gray-300`
              }`}
            >
              <div className="text-4xl mb-2">{mood.emoji}</div>
              <div className="font-medium">{mood.label}</div>
            </button>
          ))}
        </div>

        {currentMood && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              You're feeling <span className="font-medium text-gray-900">{currentMood.label.toLowerCase()}</span> today. 
              You can update your mood anytime.
            </p>
          </div>
        )}
      </div>

      {/* Mood History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent History</h3>
        </div>
        {history.length > 0 ? (
          <div className="grid grid-cols-7 gap-3">
            {history.map((entry, idx) => {
              const moodData = moodOptions.find(m => m.value === entry.mood) || moodOptions[1];
              return (
                <div
                  key={entry._id || idx}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all ${moodData.color}`}
                >
                  <span className="text-xl">{moodData.emoji}</span>
                  <span className="text-xs mt-1 font-medium">
                    {new Date(entry.day).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Start tracking your mood to see your history!</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
            <div className="text-2xl mb-1">😊</div>
            <p className="text-2xl font-bold text-green-600">
              {history.filter(h => h.mood === 'good').length}
            </p>
            <p className="text-xs text-gray-600">Good days</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-100">
            <div className="text-2xl mb-1">😐</div>
            <p className="text-2xl font-bold text-amber-600">
              {history.filter(h => h.mood === 'neutral').length}
            </p>
            <p className="text-xs text-gray-600">Okay days</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
            <div className="text-2xl mb-1">😔</div>
            <p className="text-2xl font-bold text-red-600">
              {history.filter(h => h.mood === 'bad').length}
            </p>
            <p className="text-xs text-gray-600">Tough days</p>
          </div>
        </div>
      </div>
    </div>
  );
}