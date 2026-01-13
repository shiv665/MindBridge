import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, Calendar, Eye, X, BookOpen, Edit2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Journal() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", visibility: "private" });
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [moodHistory, setMoodHistory] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // null = show all

  const load = () => api.get("/journals").then(res => setList(res.data));
  
  const loadMoodHistory = async () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    try {
      const res = await api.get(`/mood/history?year=${year}&month=${month}`);
      setMoodHistory(res.data);
    } catch (err) {
      setMoodHistory({});
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadMoodHistory(); }, [currentDate]);

  const create = async () => {
    try {
      await api.post("/journals", form);
      setForm({ title: "", body: "", visibility: "private" });
      setShowNewEntry(false);
      load();
      toast.success("Journal entry saved! 📝");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save journal entry");
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null); // Reset filter when changing month
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null); // Reset filter when changing month
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isFutureDate = (day) => {
    const today = new Date();
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate > today;
  };

  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const handleDateClick = (day) => {
    if (isFutureDate(day)) return;
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // If same date is clicked again, clear filter
    if (selectedDate && isSelectedDate(day)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(clickedDate);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const getMoodStyle = (day) => {
    if (isFutureDate(day)) return "bg-gray-50 text-gray-300 cursor-not-allowed";
    const mood = moodHistory[day];
    const baseStyle = "cursor-pointer hover:ring-2 hover:ring-blue-400";
    switch (mood) {
      case "good": return `bg-green-100 text-green-700 ${baseStyle}`;
      case "neutral": return `bg-yellow-100 text-yellow-700 ${baseStyle}`;
      case "bad": return `bg-red-100 text-red-700 ${baseStyle}`;
      default: return `bg-gray-100 text-gray-500 ${baseStyle}`;
    }
  };

  const getMoodEmoji = (day) => {
    if (isFutureDate(day)) return "";
    const mood = moodHistory[day];
    switch (mood) {
      case "good": return "😊";
      case "neutral": return "😐";
      case "bad": return "😔";
      default: return "";
    }
  };

  // Filter journals based on selected date
  const filteredList = selectedDate 
    ? list.filter(journal => {
        const journalDate = new Date(journal.createdAt);
        return journalDate.getDate() === selectedDate.getDate() &&
               journalDate.getMonth() === selectedDate.getMonth() &&
               journalDate.getFullYear() === selectedDate.getFullYear();
      })
    : list;

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Journal</h1>
          <p className="text-gray-600 mt-1">Record your thoughts and reflections</p>
        </div>
        <button
          onClick={() => setShowNewEntry(true)}
          className="btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </button>
      </div>

      {/* Mood Calendar - Compact */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
            Mood Calendar
          </h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button 
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-3 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-100 rounded"></span>
            <span className="text-gray-500">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-100 rounded"></span>
            <span className="text-gray-500">Okay</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-100 rounded"></span>
            <span className="text-gray-500">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-100 rounded"></span>
            <span className="text-gray-500">No entry</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
              {day}
            </div>
          ))}
          {/* Empty cells for days before first day of month */}
          {[...Array(firstDay)].map((_, i) => (
            <div key={`empty-${i}`} className="h-8"></div>
          ))}
          {/* Days of month */}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-8 rounded flex flex-col items-center justify-center text-xs font-medium transition-all ${getMoodStyle(day)} ${isToday(day) ? 'ring-2 ring-blue-500' : ''} ${isSelectedDate(day) ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
                title={moodHistory[day] ? `Mood: ${moodHistory[day]} - Click to filter` : 'Click to filter journals'}
              >
                <span>{day}</span>
                {getMoodEmoji(day) && <span className="text-[10px] leading-none">{getMoodEmoji(day)}</span>}
              </div>
            );
          })}
        </div>

        {/* Selected date indicator */}
        {selectedDate && (
          <div className="mt-3 flex items-center justify-between bg-purple-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-purple-700">
              Showing journals for: <strong>{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            </span>
            <button
              onClick={clearDateFilter}
              className="flex items-center text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Show All
            </button>
          </div>
        )}
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate ? 'Filtered Entries' : 'All Entries'}
            <span className="ml-2 text-sm font-normal text-gray-500">({filteredList.length})</span>
          </h2>
        </div>
        {filteredList.length > 0 ? filteredList.map((journal) => (
          <div 
            key={journal._id} 
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{journal.title}</h3>
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                <Eye className="w-3 h-3 mr-1" />
                {journal.visibility}
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">{journal.body}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {new Date(journal.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <button className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm">
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            {selectedDate ? (
              <>
                <p className="text-gray-500 mb-4">No journal entries for this date.</p>
                <button
                  onClick={clearDateFilter}
                  className="btn bg-purple-600 hover:bg-purple-700"
                >
                  Show All Entries
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">Start your journaling journey. Write your first entry!</p>
                <button
                  onClick={() => setShowNewEntry(true)}
                  className="btn"
                >
                  Create First Entry
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* New Entry Modal */}
      {showNewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowNewEntry(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-lg w-full border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">New Journal Entry</h2>
              <button 
                onClick={() => setShowNewEntry(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input 
                  className="input" 
                  placeholder="Give your entry a title" 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Thoughts</label>
                <textarea 
                  className="input min-h-[150px] resize-none" 
                  placeholder="What's on your mind today?" 
                  value={form.body} 
                  onChange={e => setForm({...form, body: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
                <select 
                  className="input" 
                  value={form.visibility} 
                  onChange={e => setForm({...form, visibility: e.target.value})}
                >
                  <option value="private">Private — Only you can see</option>
                  <option value="circle">Circles — Share with your circles</option>
                  <option value="public">Public — Everyone can see</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowNewEntry(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={create}
                  className="flex-1 btn"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}