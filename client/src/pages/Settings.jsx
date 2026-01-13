import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api";
import { User, Camera, Save, Plus, X, Mail, FileText, Heart, Lock, Trash2, Shield, Eye, EyeOff, MessageCircle, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, fetchMe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    interests: [],
    avatar: ""
  });
  
  const [newInterest, setNewInterest] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || "",
        bio: user.bio || "",
        interests: user.interests || [],
        avatar: user.avatar || ""
      });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await api.put("/auth/me", {
        displayName: form.displayName,
        bio: form.bio,
        interests: form.interests,
        avatar: form.avatar
      });
      await fetchMe();
      toast.success("Profile updated successfully! ✨");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
    setLoading(false);
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !form.interests.includes(newInterest.trim())) {
      setForm({ ...form, interests: [...form.interests, newInterest.trim()] });
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest) => {
    setForm({ ...form, interests: form.interests.filter(i => i !== interest) });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success("Password changed successfully! 🔐");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
    setLoading(false);
  };

  const suggestedInterests = [
    "Anxiety", "Depression", "Mindfulness", "Meditation", "Self-care",
    "Stress Management", "Sleep", "Exercise", "Nutrition", "Relationships",
    "Work-Life Balance", "Therapy", "Support Groups", "Journaling", "Gratitude"
  ];

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "interests", label: "Interests", icon: Heart },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "security", label: "Security", icon: Lock }
  ];

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: false,
    showBio: true,
    showInterests: true,
    showCircles: true,
    allowMessages: true
  });

  // Load privacy settings when user loads
  useEffect(() => {
    if (user?.profileVisibility) {
      setPrivacySettings(user.profileVisibility);
    }
  }, [user]);

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      await api.put("/auth/me", {
        profileVisibility: privacySettings
      });
      await fetchMe();
      toast.success("Privacy settings updated! 🔒");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update privacy settings");
    }
    setLoading(false);
  };

  const privacyOptions = [
    {
      key: "showEmail",
      label: "Show Email",
      description: "Allow others to see your email address on your profile",
      icon: Mail
    },
    {
      key: "showBio",
      label: "Show Bio",
      description: "Display your bio on your public profile",
      icon: FileText
    },
    {
      key: "showInterests",
      label: "Show Interests",
      description: "Let others see your interests and topics you follow",
      icon: Heart
    },
    {
      key: "showCircles",
      label: "Show Circles",
      description: "Display the circles you've joined on your profile",
      icon: Users
    },
    {
      key: "allowMessages",
      label: "Allow Messages",
      description: "Let other users send you direct messages",
      icon: MessageCircle
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold border-4 border-white shadow-lg">
                      {form.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200">
                    <Camera className="w-4 h-4 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Profile Photo</h3>
                  <p className="text-sm text-gray-500">JPG, PNG or GIF. Max 2MB</p>
                  {form.avatar && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, avatar: "" })}
                      className="text-sm text-red-600 hover:text-red-700 mt-1 flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="input"
                  placeholder="Your name"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="input pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="input min-h-[100px] resize-none"
                  placeholder="Tell us a bit about yourself..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">{form.bio.length}/500 characters</p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* Interests Tab */}
          {activeTab === "interests" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your Interests
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Add topics you're interested in to help connect with like-minded people
                </p>
                
                {/* Current Interests */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {form.interests.length > 0 ? (
                    form.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No interests added yet</p>
                  )}
                </div>

                {/* Add Interest Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="input flex-1"
                    placeholder="Add a new interest..."
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="btn"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Suggested Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggested Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestedInterests
                    .filter(interest => !form.interests.includes(interest))
                    .map((interest, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setForm({ ...form, interests: [...form.interests, interest] })}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {interest}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="btn flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Interests"}
                </button>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Profile Visibility</h3>
                <p className="text-sm text-gray-500">Control what others can see on your profile</p>
              </div>

              <div className="space-y-4">
                {privacyOptions.map((option) => (
                  <div
                    key={option.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <option.icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{option.label}</h4>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings[option.key]}
                        onChange={(e) => setPrivacySettings({
                          ...privacySettings,
                          [option.key]: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Privacy Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Your Privacy Matters</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      These settings control what other users can see when they visit your profile. 
                      Your data is always secure and private by default. You can change these settings anytime.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  disabled={loading}
                  className="btn flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Privacy Settings"}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {user?.authProvider === 'google' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 text-sm">
                    You signed in with Google. Password management is handled through your Google account.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="font-medium text-gray-900">Change Password</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="input"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="input"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="input"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn flex items-center"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {loading ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </form>
              )}

              {/* Account Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-3">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Type</span>
                    <span className="text-gray-900 capitalize">{user?.authProvider || 'Local'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member Since</span>
                    <span className="text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
