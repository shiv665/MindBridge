import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";
import { 
  User, MessageCircle, Shield, ShieldOff, Clock, Calendar, 
  Tag, Users, ArrowLeft, MoreVertical, AlertTriangle, MapPin,
  Mail, Heart, Building2, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You cannot view this profile");
      } else if (err.response?.status === 404) {
        setError("User not found");
      } else {
        setError("Failed to load profile");
      }
    }
    setLoading(false);
  };

  const handleBlock = async () => {
    try {
      await api.post(`/users/${id}/block`, { reason: blockReason });
      toast.success("User blocked successfully");
      setShowBlockModal(false);
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to block user");
    }
  };

  const handleUnblock = async () => {
    try {
      await api.post(`/users/${id}/unblock`);
      toast.success("User unblocked successfully");
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to unblock user");
    }
  };

  const startChat = () => {
    navigate(`/messages/${id}`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getLastSeenText = () => {
    if (profile?.isOnline) return "Online now";
    if (!profile?.lastSeen) return "Offline";
    
    const lastSeen = new Date(profile.lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return formatDate(profile.lastSeen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-500 mb-4">This profile may be blocked or doesn't exist.</p>
          <button onClick={() => navigate(-1)} className="btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Cover/Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4 flex items-end justify-between">
            <div className="relative">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-blue-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                  {profile.displayName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              {/* Online indicator */}
              {profile.isOnline && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-2">
              {profile.allowMessages && !profile.isBlockedByMe && (
                <button
                  onClick={startChat}
                  className="btn flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              )}
              
              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      {profile.isBlockedByMe ? (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            handleUnblock();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <ShieldOff className="w-4 h-4" />
                          Unblock User
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowBlockModal(true);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          Block User
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Name & Status */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className={`flex items-center gap-1 ${profile.isOnline ? 'text-green-600' : ''}`}>
                <Clock className="w-4 h-4" />
                {getLastSeenText()}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-700 mb-4">{profile.bio}</p>
          )}

          {/* Blocked Warning */}
          {profile.isBlockedByMe && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700">You have blocked this user</p>
                <p className="text-xs text-red-600">You won't receive messages from them.</p>
              </div>
            </div>
          )}

          {/* Messages Disabled Warning */}
          {!profile.allowMessages && !profile.isBlockedByMe && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-yellow-700">Messages disabled</p>
                <p className="text-xs text-yellow-600">This user has disabled direct messages.</p>
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Circles */}
      {profile.circles && profile.circles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Circles
            </h2>
            <span className="text-sm text-gray-500">{profile.circles.length} circles</span>
          </div>
          <div className="divide-y divide-gray-100">
            {profile.circles.map((circle) => (
              <Link
                key={circle._id}
                to={`/circles/${circle._id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {circle.coverImage ? (
                    <img 
                      src={circle.coverImage} 
                      alt={circle.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white/60" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{circle.title}</h3>
                  <p className="text-sm text-gray-500">
                    {circle.members?.length || 0} members
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBlockModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Block {profile.displayName}?</h2>
                <p className="text-sm text-gray-500">They won't be able to message you.</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Why are you blocking this user?"
                className="input min-h-[80px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowBlockModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlock}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
