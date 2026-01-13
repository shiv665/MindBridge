import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { 
  Plus, Search, Globe, Lock, X, Users, Check, Clock, Tag, Sparkles, 
  ImagePlus, TrendingUp, Filter, Grid3X3, List, MoreHorizontal,
  ChevronRight, UserPlus, Building2, Calendar
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const SUGGESTED_TAGS = [
  "Anxiety", "Depression", "Mindfulness", "Meditation", "Self-care", 
  "Stress Management", "Sleep", "Exercise", "Nutrition", "Relationships", 
  "Work-Life Balance", "Therapy", "Support Groups", "Journaling", "Gratitude",
  "Mental Health", "Wellness", "Recovery", "Coping Skills", "Positivity"
];

export default function Circles() {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [myCircles, setMyCircles] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", visibility: "public", tags: [], coverImage: "" });
  const [tagInput, setTagInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover"); // "discover", "my-circles", "recommended"
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [filterTag, setFilterTag] = useState("");

  const load = () => api.get("/circles").then(res => {
    setCircles(res.data);
    // Filter circles user is member of
    const userCircles = res.data.filter(c => 
      c.members?.some(m => (typeof m === 'object' ? m._id : m) === user?._id)
    );
    setMyCircles(userCircles);
  });
  
  const loadRecommendations = () => api.get("/circles/recommendations").then(res => setRecommendations(res.data)).catch(() => {});
  
  useEffect(() => { 
    load(); 
    loadRecommendations();
  }, [user?._id]);

  const create = async () => {
    try {
      await api.post("/circles", form);
      setForm({ title: "", description: "", visibility: "public", tags: [], coverImage: "" });
      setTagInput("");
      setBannerPreview(null);
      setShowCreateModal(false);
      load();
      loadRecommendations();
      toast.success("Circle created successfully! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create circle");
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
        setForm({ ...form, coverImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBanner = () => {
    setBannerPreview(null);
    setForm({ ...form, coverImage: "" });
  };

  const join = async (id) => { 
    try {
      await api.post(`/circles/${id}/join`); 
      load(); 
      loadRecommendations();
      toast.success("Joined circle successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join circle");
    }
  };

  const leave = async (id) => {
    try {
      await api.post(`/circles/${id}/leave`);
      load();
      loadRecommendations();
      toast.success("Left circle successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave circle");
    }
  };

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !form.tags.includes(trimmedTag) && form.tags.length < 5) {
      setForm({ ...form, tags: [...form.tags, trimmedTag] });
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tagToRemove) });
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const isMember = (circle) => {
    return circle.members?.some(m => (typeof m === 'object' ? m._id : m) === user?._id);
  };

  const hasPendingRequest = (circle) => {
    return circle.joinRequests?.some(r => (typeof r === 'object' ? r._id : r) === user?._id);
  };

  const filteredCircles = circles.filter(circle => {
    const matchesSearch = 
      circle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      circle.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      circle.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = !filterTag || circle.tags?.some(t => t.toLowerCase() === filterTag.toLowerCase());
    
    return matchesSearch && matchesTag;
  });

  const getDisplayedCircles = () => {
    switch (activeTab) {
      case "my-circles":
        return myCircles.filter(c => 
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "recommended":
        return recommendations;
      default:
        return filteredCircles;
    }
  };

  const displayedCircles = getDisplayedCircles();

  // Get popular tags from all circles
  const popularTags = [...new Set(circles.flatMap(c => c.tags || []))].slice(0, 10);

  return (
    <div className="space-y-6">
      {/* LinkedIn-style Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute bottom-4 left-6 text-white">
            <h1 className="text-2xl font-bold">Circles</h1>
            <p className="text-blue-100 text-sm mt-1">Connect with communities that matter to you</p>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{myCircles.length}</p>
              <p className="text-xs text-gray-500">My Circles</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{circles.length}</p>
              <p className="text-xs text-gray-500">Total Circles</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{recommendations.length}</p>
              <p className="text-xs text-gray-500">For You</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Circle
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for circles, topics, or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 border-b border-gray-100 -mb-4 pb-0">
            <button
              onClick={() => setActiveTab("discover")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "discover" 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Discover
              </span>
            </button>
            <button
              onClick={() => setActiveTab("my-circles")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "my-circles" 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                My Circles
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {myCircles.length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("recommended")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "recommended" 
                  ? "border-purple-600 text-purple-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                For You
                {recommendations.length > 0 && (
                  <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                    {recommendations.length}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Popular Tags Filter */}
      {activeTab === "discover" && popularTags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by topic</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTag("")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filterTag 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {popularTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => setFilterTag(filterTag === tag ? "" : tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterTag === tag 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Banner */}
      {activeTab === "recommended" && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-900">Personalized for you</p>
            <p className="text-xs text-purple-700">Based on your interests: {user?.interests?.slice(0, 3).join(", ") || "Add interests in Settings"}</p>
          </div>
          <Link to="/settings" className="ml-auto text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
            Update interests
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Circles Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedCircles.map((circle) => (
            <CircleCard 
              key={circle._id} 
              circle={circle} 
              isMember={isMember(circle)}
              hasPendingRequest={hasPendingRequest(circle)}
              onJoin={() => join(circle._id)}
              onLeave={() => leave(circle._id)}
              isRecommended={activeTab === "recommended"}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedCircles.map((circle) => (
            <CircleListItem
              key={circle._id} 
              circle={circle} 
              isMember={isMember(circle)}
              hasPendingRequest={hasPendingRequest(circle)}
              onJoin={() => join(circle._id)}
              onLeave={() => leave(circle._id)}
              isRecommended={activeTab === "recommended"}
            />
          ))}
        </div>
      )}

      {displayedCircles.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          {activeTab === "recommended" ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                Add your interests in Settings to get personalized circle recommendations!
              </p>
              <Link to="/settings" className="btn">
                Update Interests
              </Link>
            </>
          ) : activeTab === "my-circles" ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">You haven't joined any circles yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                Discover circles that match your interests and connect with others!
              </p>
              <button onClick={() => setActiveTab("discover")} className="btn">
                Discover Circles
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No circles found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                {searchQuery ? "Try a different search term" : "Be the first to create a circle!"}
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn">
                Create Circle
              </button>
            </>
          )}
        </div>
      )}

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-0 max-w-lg w-full border border-gray-200 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Create a Circle</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-5">
                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                  {bannerPreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img 
                        src={bannerPreview} 
                        alt="Banner preview" 
                        className="w-full h-36 object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeBanner}
                        className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all group">
                      <div className="p-3 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                        <ImagePlus className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-500 mt-2">Click to upload banner</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleBannerUpload}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Circle Name *</label>
                  <input 
                    className="input" 
                    placeholder="Give your circle a name" 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea 
                    className="input min-h-[100px] resize-none" 
                    placeholder="What is this circle about? What can members expect?" 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>
                
                {/* Tags Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topics <span className="text-gray-400 font-normal">({form.tags.length}/5)</span>
                  </label>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          {tag}
                          <button 
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 hover:text-blue-900"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    className="input"
                    placeholder="Add a topic and press Enter"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    disabled={form.tags.length >= 5}
                  />
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Popular topics:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_TAGS.filter(t => !form.tags.includes(t)).slice(0, 8).map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => addTag(tag)}
                          disabled={form.tags.length >= 5}
                          className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({...form, visibility: "public"})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.visibility === "public" 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Globe className={`w-5 h-5 mb-2 ${form.visibility === "public" ? "text-blue-600" : "text-gray-400"}`} />
                      <p className="font-medium text-gray-900 text-sm">Public</p>
                      <p className="text-xs text-gray-500 mt-0.5">Anyone can join</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({...form, visibility: "private"})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.visibility === "private" 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Lock className={`w-5 h-5 mb-2 ${form.visibility === "private" ? "text-blue-600" : "text-gray-400"}`} />
                      <p className="font-medium text-gray-900 text-sm">Private</p>
                      <p className="text-xs text-gray-500 mt-0.5">Approval required</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={create}
                disabled={!form.title.trim()}
                className="flex-1 btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Circle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Circle Card Component (Grid View)
function CircleCard({ circle, isMember, hasPendingRequest, onJoin, onLeave, isRecommended }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all overflow-hidden group">
      {/* Cover Image */}
      <div className="h-28 relative overflow-hidden">
        {circle.coverImage ? (
          <img 
            src={circle.coverImage} 
            alt={circle.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Building2 className="w-10 h-10 text-white/40" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isRecommended && (
            <span className="px-2 py-1 bg-purple-500 text-white rounded-md text-xs font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              For You
            </span>
          )}
          {circle.visibility === 'private' && (
            <span className="px-2 py-1 bg-black/40 text-white rounded-md text-xs font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private
            </span>
          )}
        </div>

        {/* Member count on image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm">
          <Users className="w-4 h-4" />
          <span className="font-medium">{circle.members?.length || 0}</span>
          <span className="text-white/80">members</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">{circle.title}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 min-h-[40px]">
          {circle.description || 'A community space for sharing and support.'}
        </p>
        
        {/* Tags */}
        {circle.tags && circle.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {circle.tags.slice(0, 2).map((tag, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {circle.tags.length > 2 && (
              <span className="text-xs text-gray-400">+{circle.tags.length - 2}</span>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link 
            to={`/circles/${circle._id}`}
            className="flex-1 py-2 text-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            View
          </Link>
          {isMember ? (
            <button 
              onClick={onLeave}
              className="flex-1 py-2 text-center text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Joined
            </button>
          ) : hasPendingRequest ? (
            <button 
              disabled
              className="flex-1 py-2 text-center text-sm font-medium bg-yellow-50 text-yellow-700 rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              Pending
            </button>
          ) : (
            <button 
              onClick={onJoin}
              className="flex-1 py-2 text-center text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              {circle.visibility === 'public' ? 'Join' : 'Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Circle List Item Component (List View)
function CircleListItem({ circle, isMember, hasPendingRequest, onJoin, onLeave, isRecommended }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all p-4 flex items-center gap-4">
      {/* Circle Avatar */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        {circle.coverImage ? (
          <img 
            src={circle.coverImage} 
            alt={circle.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white/60" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">{circle.title}</h3>
          {isRecommended && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" />
              For You
            </span>
          )}
          {circle.visibility === 'private' && (
            <Lock className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
        <p className="text-gray-500 text-sm line-clamp-1 mb-2">
          {circle.description || 'A community space for sharing and support.'}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {circle.members?.length || 0} members
          </span>
          {circle.tags && circle.tags.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {circle.tags.slice(0, 2).join(", ")}
              {circle.tags.length > 2 && ` +${circle.tags.length - 2}`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link 
          to={`/circles/${circle._id}`}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          View
        </Link>
        {isMember ? (
          <button 
            onClick={onLeave}
            className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Joined
          </button>
        ) : hasPendingRequest ? (
          <button 
            disabled
            className="px-4 py-2 text-sm font-medium bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-1.5 cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
            Pending
          </button>
        ) : (
          <button 
            onClick={onJoin}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            {circle.visibility === 'public' ? 'Join' : 'Request'}
          </button>
        )}
      </div>
    </div>
  );
}
