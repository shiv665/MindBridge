import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { TrendingUp, User, ThumbsUp, MessageCircle, ArrowRight, Users, Calendar, Send, Trash2, Sparkles, Tag, Share2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [mood, setMood] = useState(null);
  const [posts, setPosts] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Fetch circle recommendations - filter out circles user is already in
    api.get("/circles/recommendations").then(res => {
      const filtered = res.data.filter(circle => 
        !circle.members?.some(m => (typeof m === 'object' ? m._id : m) === user?._id)
      );
      setRecommendations(filtered.slice(0, 3));
    }).catch(() => {
      // Fallback to regular circles if recommendations fail
      api.get("/circles").then(res => {
        const filtered = res.data.filter(circle => 
          !circle.members?.some(m => (typeof m === 'object' ? m._id : m) === user?._id)
        );
        setRecommendations(filtered.slice(0, 3));
      });
    });
    api.get("/mood/today").then(res => setMood(res.data));
    api.get("/posts/me").then(res => setPosts(res.data.slice(0, 3))).catch(() => setPosts([]));
    api.get("/messages/unread/count").then(res => setUnreadMessages(res.data.count)).catch(() => setUnreadMessages(0));
    setUpdates([{ text: "Welcome to MindBridge! Start by joining a circle or tracking your mood." }]);
  }, [user?._id]);

  // Check if current user has liked a post
  const hasLiked = (post) => {
    return post.likes?.includes(user?._id);
  };

  // Toggle like/unlike
  const toggleLike = async (postId) => {
    const post = posts.find(p => p._id === postId);
    try {
      if (hasLiked(post)) {
        const res = await api.post(`/posts/${postId}/unlike`);
        setPosts(posts.map(p => p._id === postId ? res.data : p));
      } else {
        const res = await api.post(`/posts/${postId}/like`);
        setPosts(posts.map(p => p._id === postId ? res.data : p));
      }
    } catch (err) {
      toast.error("Failed to update like");
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Add a comment
  const addComment = async (postId) => {
    const body = commentInputs[postId]?.trim();
    if (!body) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { body });
      setPosts(posts.map(p => p._id === postId ? res.data : p));
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      toast.success("Comment added!");
    } catch (err) {
      toast.error("Failed to add comment");
    }
  };

  // Delete a comment
  const deleteComment = async (postId, commentId) => {
    try {
      const res = await api.delete(`/posts/${postId}/comments/${commentId}`);
      setPosts(posts.map(p => p._id === postId ? res.data : p));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  // Share post function
  const sharePost = async (post) => {
    const url = `${window.location.origin}/circles/${post.circle?._id}/post/${post._id}`;
    const shareData = {
      title: post.title || 'MindBridge Post',
      text: post.body?.substring(0, 100) + (post.body?.length > 100 ? '...' : ''),
      url
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyPostLink(url);
        }
      }
    } else {
      copyPostLink(url);
    }
  };

  const copyPostLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  const moodConfig = {
    good: { emoji: '😊', label: 'Good', color: 'bg-green-100 text-green-700 border-green-200' },
    neutral: { emoji: '😐', label: 'Okay', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    bad: { emoji: '😔', label: 'Not great', color: 'bg-red-100 text-red-700 border-red-200' },
    not_added: { emoji: '➕', label: 'Not set', color: 'bg-gray-100 text-gray-700 border-gray-200' }
  };

  const currentMood = mood?.mood ? moodConfig[mood.mood] : moodConfig.not_added;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.displayName || 'Friend'}!</h1>
            <p className="text-gray-600 mt-1">Here's what's happening in your community</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/messages"
              className="relative inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages
              {unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
            <Link 
              to="/mood"
              className={`inline-flex items-center px-4 py-2 rounded-lg border ${currentMood.color} font-medium text-sm`}
            >
              <span className="mr-2">{currentMood.emoji}</span>
              Today: {currentMood.label}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {posts.length > 0 ? posts.map((post) => (
                <div key={post._id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {post.author?.avatar ? (
                        <img 
                          src={post.author.avatar }
                          alt={post.author.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />  
                      ) : (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{post.author?.displayName || 'Anonymous'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                      <p className="text-gray-600 text-sm line-clamp-2">{post.body}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <button 
                          onClick={() => toggleLike(post._id)}
                          className={`flex items-center text-sm transition-colors ${
                            hasLiked(post) 
                              ? 'text-blue-600' 
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 mr-1 ${hasLiked(post) ? 'fill-current' : ''}`} />
                          {post.likes?.length || 0}
                        </button>
                        <button 
                          onClick={() => toggleComments(post._id)}
                          className={`flex items-center text-sm transition-colors ${
                            expandedComments[post._id] 
                              ? 'text-blue-600' 
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments?.length || 0}
                        </button>
                        <button 
                          onClick={() => sharePost(post)}
                          className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
                          title="Share post"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedComments[post._id] && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          {/* Comment Input */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <input
                              type="text"
                              className="input flex-1 text-sm py-1.5"
                              placeholder="Write a comment..."
                              value={commentInputs[post._id] || ""}
                              onChange={(e) => setCommentInputs(prev => ({
                                ...prev,
                                [post._id]: e.target.value
                              }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') addComment(post._id);
                              }}
                            />
                            <button
                              onClick={() => addComment(post._id)}
                              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Comments List */}
                          <div className="space-y-2">
                            {post.comments?.length > 0 ? (
                              post.comments.slice(0, 3).map((comment) => (
                                <div key={comment._id} className="flex items-start gap-2 group">
                                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-3 h-3 text-gray-500" />
                                  </div>
                                  <div className="flex-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-gray-900">
                                        {comment.author?.displayName || 'Anonymous'}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">
                                          {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                        {/* Post author or comment author can delete */}
                                        {(comment.author?._id === user?._id || post.author?._id === user?._id) && (
                                          <button
                                            onClick={() => deleteComment(post._id, comment._id)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
                                            title="Delete comment"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-600">{comment.body}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400 text-center py-1">No comments yet</p>
                            )}
                            {post.comments?.length > 3 && (
                              <Link 
                                to={`/circles/${post.circle?._id}`}
                                className="text-xs text-blue-600 hover:text-blue-700 block text-center"
                              >
                                View all {post.comments.length} comments
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">No posts yet. Join a circle to see activity!</p>
                  <Link to="/circles" className="btn">Explore Circles</Link>
                </div>
              )}
            </div>
          </div>

          {/* Updates */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-medium text-blue-900 mb-2">💡 Getting Started</h3>
            {updates.map((u, i) => (
              <p key={i} className="text-blue-700 text-sm">{u.text}</p>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggested Circles */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                Recommended For You
              </h2>
              <Link to="/circles" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recommendations.length > 0 ? recommendations.map((circle) => (
                <Link 
                  key={circle._id} 
                  to={`/circles/${circle._id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{circle.title}</h3>
                      <p className="text-xs text-gray-500">{circle.members?.length || 0} members</p>
                      {circle.tags && circle.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {circle.tags.slice(0, 2).map((tag, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs"
                            >
                              <Tag className="w-2.5 h-2.5 mr-0.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              )) : (
                <p className="p-4 text-gray-500 text-sm text-center">Loading circles...</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{currentMood.emoji}</span>
                  </div>
                  <span className="text-sm text-gray-600">Today's Mood</span>
                </div>
                <span className="font-medium text-gray-900">{currentMood.label}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Circles</span>
                </div>
                <span className="font-medium text-gray-900">{recommendations.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-600">Recent Posts</span>
                </div>
                <span className="font-medium text-gray-900">{posts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}