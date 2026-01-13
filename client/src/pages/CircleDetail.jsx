import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, User, ThumbsUp, MessageCircle, ArrowLeft, X, Users, Send, Trash2, Edit2, MoreVertical, Settings, UserMinus, Shield, ShieldOff, Check, XCircle, Tag, Globe, Lock, ImagePlus, MoreHorizontal, Share2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const SUGGESTED_TAGS = [
  "Anxiety", "Depression", "Mindfulness", "Meditation", "Self-care", 
  "Stress Management", "Sleep", "Exercise", "Nutrition", "Relationships", 
  "Work-Life Balance", "Therapy", "Support Groups", "Journaling", "Gratitude",
  "Mental Health", "Wellness", "Recovery", "Coping Skills", "Positivity"
];

export default function CircleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [circle, setCircle] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", attachmentUrl: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editPostForm, setEditPostForm] = useState({ title: "", body: "" });
  const [editCommentBody, setEditCommentBody] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(null);
  
  // Edit circle state
  const [editingCircle, setEditingCircle] = useState(false);
  const [editCircleForm, setEditCircleForm] = useState({ title: "", description: "", visibility: "public", tags: [], coverImage: "" });
  const [circleTagInput, setCircleTagInput] = useState("");
  const [editBannerPreview, setEditBannerPreview] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const load = () => {
    api.get(`/posts/circle/${id}`).then(res => setPosts(res.data));
    api.get(`/circles/${id}`).then(res => setCircle(res.data)).catch(() => {});
  };
  
  useEffect(() => { if (id) load(); }, [id]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareMenuOpen && !e.target.closest('.share-menu-container')) {
        setShareMenuOpen(null);
      }
      if (postMenuOpen && !e.target.closest('.post-menu-container')) {
        setPostMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [shareMenuOpen, postMenuOpen]);

  // Share post functions
  const copyPostLink = (postId) => {
    const url = `${window.location.origin}/circles/${id}/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
    setShareMenuOpen(null);
  };

  const sharePost = async (post) => {
    const shareData = {
      title: post.title || 'MindBridge Post',
      text: post.body?.substring(0, 100) + (post.body?.length > 100 ? '...' : ''),
      url: `${window.location.origin}/circles/${id}/post/${post._id}`
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    } else {
      copyPostLink(post._id);
    }
    setShareMenuOpen(null);
  };

  const shareToCircle = (post) => {
    toast.success("Share to circle feature coming soon!");
    setShareMenuOpen(null);
  };

  // Share circle function
  const shareCircle = async () => {
    const shareData = {
      title: circle?.title || 'MindBridge Circle',
      text: circle?.description?.substring(0, 100) + (circle?.description?.length > 100 ? '...' : '') || 'Join this circle on MindBridge!',
      url: `${window.location.origin}/circles/${id}`
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyCircleLink();
        }
      }
    } else {
      copyCircleLink();
    }
  };

  const copyCircleLink = () => {
    const url = `${window.location.origin}/circles/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Circle link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  // Check if current user is admin of this circle
  const isAdmin = circle?.admins?.some(admin => 
    (typeof admin === 'object' ? admin._id : admin) === user?._id
  );

  // Check if current user is member
  const isMember = circle?.members?.some(member => 
    (typeof member === 'object' ? member._id : member) === user?._id
  );

  // Check if user has pending join request
  const hasPendingRequest = circle?.joinRequests?.some(req => 
    (typeof req === 'object' ? req._id : req) === user?._id
  );

  // Join circle
  const joinCircle = async () => {
    try {
      const res = await api.post(`/circles/${id}/join`);
      setCircle(res.data);
      if (circle?.visibility === 'public') {
        toast.success("You've joined the circle!");
      } else {
        toast.success("Join request sent! Waiting for admin approval.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join circle");
    }
  };

  // Leave circle
  const leaveCircle = async () => {
    if (!confirm("Are you sure you want to leave this circle?")) return;
    try {
      const res = await api.post(`/circles/${id}/leave`);
      setCircle(res.data);
      toast.success("You've left the circle");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave circle");
    }
  };

  const create = async () => {
    try {
      await api.post("/posts", { ...form, circle: id });
      setForm({ title: "", body: "", attachmentUrl: "" });
      setImagePreview(null);
      setShowNewPost(false);
      load();
      toast.success("Post created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    }
  };

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

  // Edit post
  const startEditPost = (post) => {
    setEditingPost(post._id);
    setEditPostForm({ title: post.title, body: post.body });
    setPostMenuOpen(null);
  };

  const saveEditPost = async (postId) => {
    try {
      const res = await api.put(`/posts/${postId}`, editPostForm);
      setPosts(posts.map(p => p._id === postId ? res.data : p));
      setEditingPost(null);
      toast.success("Post updated!");
    } catch (err) {
      toast.error("Failed to update post");
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
      toast.success("Post deleted");
    } catch (err) {
      toast.error("Failed to delete post");
    }
    setPostMenuOpen(null);
  };

  // Edit comment
  const startEditComment = (postId, comment) => {
    setEditingComment({ postId, commentId: comment._id });
    setEditCommentBody(comment.body);
  };

  const saveEditComment = async () => {
    if (!editingComment) return;
    try {
      const res = await api.put(`/posts/${editingComment.postId}/comments/${editingComment.commentId}`, {
        body: editCommentBody
      });
      setPosts(posts.map(p => p._id === editingComment.postId ? res.data : p));
      setEditingComment(null);
      setEditCommentBody("");
      toast.success("Comment updated!");
    } catch (err) {
      toast.error("Failed to update comment");
    }
  };

  // Check if user can edit/delete a post
  const canModifyPost = (post) => {
    return post.author?._id === user?._id || isAdmin;
  };

  // Check if user can edit a comment (only comment author)
  const canEditComment = (comment) => {
    return comment.author?._id === user?._id;
  };

  // Check if user can delete a comment (comment author, post author, or admin)
  const canDeleteComment = (post, comment) => {
    return comment.author?._id === user?._id || post.author?._id === user?._id || isAdmin;
  };

  // Admin functions
  const approveRequest = async (userId) => {
    try {
      const res = await api.post(`/circles/${id}/requests/${userId}/approve`);
      setCircle(res.data);
      toast.success("Request approved!");
    } catch (err) {
      toast.error("Failed to approve request");
    }
  };

  const rejectRequest = async (userId) => {
    try {
      const res = await api.post(`/circles/${id}/requests/${userId}/reject`);
      setCircle(res.data);
      toast.success("Request rejected");
    } catch (err) {
      toast.error("Failed to reject request");
    }
  };

  const removeMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await api.post(`/circles/${id}/members/${userId}/remove`);
      setCircle(res.data);
      toast.success("Member removed");
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  const promoteMember = async (userId) => {
    try {
      const res = await api.post(`/circles/${id}/members/${userId}/promote`);
      setCircle(res.data);
      toast.success("Member promoted to admin!");
    } catch (err) {
      toast.error("Failed to promote member");
    }
  };

  const demoteMember = async (userId) => {
    try {
      const res = await api.post(`/circles/${id}/members/${userId}/demote`);
      setCircle(res.data);
      toast.success("Admin demoted to member");
    } catch (err) {
      toast.error("Failed to demote admin");
    }
  };

  // Circle edit functions
  const startEditCircle = () => {
    setEditCircleForm({
      title: circle?.title || "",
      description: circle?.description || "",
      visibility: circle?.visibility || "public",
      tags: circle?.tags || [],
      coverImage: circle?.coverImage || ""
    });
    setEditBannerPreview(circle?.coverImage || null);
    setEditingCircle(true);
  };

  const saveCircleEdit = async () => {
    try {
      const res = await api.put(`/circles/${id}`, editCircleForm);
      setCircle(res.data);
      setEditingCircle(false);
      setEditBannerPreview(null);
      toast.success("Circle updated successfully!");
    } catch (err) {
      toast.error("Failed to update circle");
    }
  };

  const handleEditBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditBannerPreview(reader.result);
        setEditCircleForm({ ...editCircleForm, coverImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEditBanner = () => {
    setEditBannerPreview(null);
    setEditCircleForm({ ...editCircleForm, coverImage: "" });
  };

  const addCircleTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !editCircleForm.tags.includes(trimmedTag) && editCircleForm.tags.length < 5) {
      setEditCircleForm({ ...editCircleForm, tags: [...editCircleForm.tags, trimmedTag] });
    }
    setCircleTagInput("");
  };

  const removeCircleTag = (tagToRemove) => {
    setEditCircleForm({ ...editCircleForm, tags: editCircleForm.tags.filter(t => t !== tagToRemove) });
  };

  const handleCircleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCircleTag(circleTagInput);
    }
  };

  const getMemberId = (member) => typeof member === 'object' ? member._id : member;
  const isUserAdmin = (userId) => circle?.admins?.some(admin => getMemberId(admin) === userId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* --- LinkedIn Style Header --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        {/* Banner */}
        <div className="relative h-40 md:h-52 w-full bg-gray-200 group">
          {circle?.coverImage ? (
            <img 
              src={circle.coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-100 to-blue-200" />
          )}
          
          <Link 
            to="/circles"
            className="absolute top-4 left-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm backdrop-blur-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 md:-mt-8 mb-4 relative z-10">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-xl shadow-md border-4 border-white overflow-hidden flex items-center justify-center flex-shrink-0">
               {circle?.coverImage ? (
                <img src={circle.coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-12 h-12 text-blue-600" />
              )}
            </div>

            {/* Title & Stats */}
            <div className="mt-3 md:mt-0 md:ml-4 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {circle?.title || 'Loading...'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-600 text-sm">
                 {circle?.visibility === 'public' ? (
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Public Group</span>
                 ) : (
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Private Group</span>
                 )}
                 <span>•</span>
                 <span>{circle?.members?.length || 0} members</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="px-4 py-1.5 border border-blue-600 text-blue-600 font-medium rounded-full hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin Tools
                </button>
              )}
              {isMember ? (
                <button 
                  onClick={leaveCircle}
                  className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 font-medium rounded-full hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  Joined ✓
                </button>
              ) : hasPendingRequest ? (
                <button 
                  disabled
                  className="px-4 py-1.5 bg-gray-100 border border-gray-300 text-gray-500 font-medium rounded-full cursor-not-allowed"
                >
                  Pending...
                </button>
              ) : (
                <button 
                  onClick={joinCircle}
                  className="px-6 py-1.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors"
                >
                  {circle?.visibility === 'private' ? 'Request to Join' : 'Join Group'}
                </button>
              )}
              <button 
                onClick={shareCircle}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                title="Share circle"
              >
                 <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Feed) - Spans 8 cols */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Create Post Input Trigger (LinkedIn Style) */}
          {isMember && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                   <User className="w-5 h-5 text-gray-500"/>
                </div>
                <button 
                  onClick={() => setShowNewPost(true)}
                  className="flex-1 text-left px-4 py-2.5 rounded-full border border-gray-300 hover:bg-gray-50 bg-white text-gray-500 font-medium transition-colors text-sm"
                >
                  Start a post
                </button>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          

          {posts.length > 0 ? posts.map((post) => (
            <div 
              key={post._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Link 
                      to={`/profile/${post.author?._id}`}
                      className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      {/* add user avatar here */}
                      {post.author?.avatar ? (
                        <img 
                          src={post.author.avatar }
                          alt={`${post.author?.displayName || 'Anonymous'}'s avatar`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </Link>
                    <div>
                      <Link 
                        to={`/profile/${post.author?._id}`}
                        className="font-semibold text-gray-900 text-sm hover:text-blue-600 hover:underline transition-colors"
                      >
                        {post.author?.displayName || 'Anonymous'}
                      </Link>
                      <div className="text-xs text-gray-500">
                         {new Date(post.createdAt).toLocaleDateString()} • <Globe className="w-3 h-3 inline" />
                      </div>
                    </div>
                  </div>

                  {canModifyPost(post) && (
                    <div className="relative post-menu-container">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPostMenuOpen(postMenuOpen === post._id ? null : post._id); }}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                      {postMenuOpen === post._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 w-32">
                          {post.author?._id === user?._id && (
                            <button
                              onClick={() => startEditPost(post)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => deletePost(post._id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="mt-3">
                   {editingPost === post._id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        className="input w-full text-sm font-medium"
                        value={editPostForm.title}
                        onChange={(e) => setEditPostForm({ ...editPostForm, title: e.target.value })}
                        placeholder="Post title"
                      />
                      <textarea
                        className="input w-full min-h-[100px] resize-none text-sm"
                        value={editPostForm.body}
                        onChange={(e) => setEditPostForm({ ...editPostForm, body: e.target.value })}
                        placeholder="Post content"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingPost(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                        <button onClick={() => saveEditPost(post._id)} className="btn text-xs px-3 py-1.5">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.title && <h3 className="text-base font-semibold text-gray-900 mb-1">{post.title}</h3>}
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{post.body}</p>
                      {post.attachmentUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={post.attachmentUrl} 
                            alt="Post attachment" 
                            className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(post.attachmentUrl, '_blank')}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Post Footer Actions */}
              <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-1">
                 <button 
                  onClick={() => toggleLike(post._id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex-1 ${
                    hasLiked(post) ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasLiked(post) ? 'fill-current' : ''}`} />
                  Like {post.likes?.length > 0 && <span>({post.likes.length})</span>}
                </button>
                <button 
                  onClick={() => toggleComments(post._id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex-1 ${
                     expandedComments[post._id] ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Comment {post.comments?.length > 0 && <span>({post.comments.length})</span>}
                </button>
                <div className="relative flex-1 share-menu-container">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShareMenuOpen(shareMenuOpen === post._id ? null : post._id); }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium w-full text-gray-500 hover:bg-gray-100"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  {shareMenuOpen === post._id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 w-48">
                      <button
                        onClick={() => copyPostLink(post._id)}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy link
                      </button>
                      {navigator.share && (
                        <button
                          onClick={() => sharePost(post)}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Share via...
                        </button>
                      )}
                      <button
                        onClick={() => shareToCircle(post)}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        Share to circle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              {expandedComments[post._id] && (
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <div className="flex gap-2 mb-4">
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 relative">
                       <input
                        type="text"
                        className="w-full border border-gray-300 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Add a comment..."
                        value={commentInputs[post._id] || ""}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && addComment(post._id)}
                      />
                      <button
                        onClick={() => addComment(post._id)}
                        className="absolute right-2 top-1.5 p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {post.comments?.map((comment) => (
                       <div key={comment._id} className="flex gap-2 group">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1">
                             <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-gray-200 shadow-sm relative">
                                <div className="flex justify-between items-start mb-1">
                                   <div>
                                     <span className="text-sm font-semibold text-gray-900 block">{comment.author?.displayName || 'Anonymous'}</span>
                                     <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                   </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {canEditComment(comment) && (
                                        <button onClick={() => startEditComment(post._id, comment)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Edit2 className="w-3 h-3" /></button>
                                      )}
                                      {canDeleteComment(post, comment) && (
                                        <button onClick={() => deleteComment(post._id, comment._id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-3 h-3" /></button>
                                      )}
                                    </div>
                                </div>
                                {editingComment?.postId === post._id && editingComment?.commentId === comment._id ? (
                                  <div className="flex gap-2">
                                    <input 
                                      className="input text-sm py-1 flex-1"
                                      value={editCommentBody}
                                      onChange={e => setEditCommentBody(e.target.value)}
                                    />
                                    <button onClick={saveEditComment} className="text-blue-600 text-xs font-medium">Save</button>
                                    <button onClick={() => setEditingComment(null)} className="text-gray-500 text-xs">Cancel</button>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-700">{comment.body}</p>
                                )}
                             </div>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )) : (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                <p className="text-gray-500 mt-1 mb-4">Start the conversation by sharing your thoughts.</p>
                <button onClick={() => setShowNewPost(true)} className="btn">Create First Post</button>
             </div>
          )}
        </div>

        {/* Right Column (Sidebar) - Spans 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* About Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About this circle</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {circle?.description || 'No description provided.'}
            </p>
            {circle?.tags && circle.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {circle.tags.map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
             <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
               <span>Visibility</span>
               <span className="font-medium text-gray-700 capitalize">{circle?.visibility}</span>
             </div>
          </div>

          {/* Members Card */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
             <div className="flex items-center justify-between mb-3">
               <h2 className="text-lg font-semibold text-gray-900">Members</h2>
               <span className="text-sm text-gray-500">{circle?.members?.length}</span>
             </div>
             <div className="flex -space-x-2 overflow-hidden mb-4">
                {circle?.members?.slice(0, 5).map((member, i) => (
                  <div key={i} className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center">
                     <User className="w-4 h-4 text-gray-500" />
                  </div>
                ))}
                {(circle?.members?.length || 0) > 5 && (
                   <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                     +{circle.members.length - 5}
                   </div>
                )}
             </div>
             <button 
               onClick={() => setShowMembersModal(true)}
               className="w-full py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-full transition-colors"
             >
               View all members
             </button>
           </div>
        </div>
      </div>

      {/* --- Modals (New Post & Admin) --- */}
      
       {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewPost(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-lg w-full border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
              <button 
                onClick={() => setShowNewPost(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                 </div>
                 <div>
                    <span className="font-semibold block">{user?.displayName || 'You'}</span>
                    <span className="text-xs text-gray-500 border border-gray-300 rounded-full px-2 py-0.5">Posting to {circle?.title}</span>
                 </div>
              </div>
              <input 
                className="w-full text-lg font-medium placeholder-gray-400 border-none focus:ring-0 px-0" 
                placeholder="What do you want to talk about?" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value })}
                autoFocus
              />
              <textarea 
                className="w-full min-h-[120px] resize-none border-none focus:ring-0 px-0 text-gray-600" 
                placeholder="Share your thoughts..." 
                value={form.body} 
                onChange={e => setForm({...form, body: e.target.value})}
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                  <button
                    onClick={() => { setImagePreview(null); setForm({...form, attachmentUrl: ""}); }}
                    className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image Upload */}
              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  <ImagePlus className="w-5 h-5 text-blue-500" />
                  Add Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Image size should be less than 5MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm({...form, attachmentUrl: reader.result});
                          setImagePreview(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex justify-end items-center pt-4 border-t border-gray-100">
                <button 
                  onClick={create}
                  disabled={!form.title && !form.body && !form.attachmentUrl}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal (Kept largely the same structure, just cleaner UI) */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdminPanel(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-200 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Circle Management</h2>
              <button onClick={() => { setShowAdminPanel(false); setEditingCircle(false); }} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {/* Edit Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-blue-600" /> Details
                  </h3>
                  {!editingCircle && (
                    <button onClick={startEditCircle} className="text-sm text-blue-600 hover:underline font-medium">Edit</button>
                  )}
                </div>
                
                {editingCircle ? (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {/* Banner Upload */}
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Cover Image</label>
                      {editBannerPreview ? (
                        <div className="relative rounded-lg overflow-hidden group">
                          <img src={editBannerPreview} alt="Preview" className="w-full h-32 object-cover" />
                          <button onClick={removeEditBanner} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-white hover:border-blue-400 transition-all">
                          <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Upload banner</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleEditBannerUpload} />
                        </label>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Name</label>
                      <input className="input w-full" value={editCircleForm.title} onChange={e => setEditCircleForm({ ...editCircleForm, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Description</label>
                      <textarea className="input w-full min-h-[80px]" value={editCircleForm.description} onChange={e => setEditCircleForm({ ...editCircleForm, description: e.target.value })} />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setEditingCircle(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
                      <button onClick={saveCircleEdit} className="flex-1 btn text-sm">Save Changes</button>
                    </div>
                  </div>
                ) : (
                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="font-medium text-gray-900">{circle?.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{circle?.description}</p>
                   </div>
                )}
              </div>

              {/* Join Requests */}
              {circle?.joinRequests?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-orange-500" /> Pending Requests
                  </h3>
                  <div className="space-y-2">
                    {circle.joinRequests.map((request) => (
                      <div key={getMemberId(request)} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{request.displayName || 'User'}</p>
                            <p className="text-xs text-gray-500">{request.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approveRequest(getMemberId(request))} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"><Check className="w-4 h-4" /></button>
                          <button onClick={() => rejectRequest(getMemberId(request))} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Members
                </h3>
                <div className="space-y-2">
                  {circle?.members?.map((member) => {
                    const memberId = getMemberId(member);
                    const memberIsAdmin = isUserAdmin(memberId);
                    const isCurrentUser = memberId === user?._id;
                    
                    return (
                      <div key={memberId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${memberIsAdmin ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.displayName || 'User'}
                              {isCurrentUser && <span className="text-gray-400 font-normal ml-1">(You)</span>}
                            </p>
                            <p className="text-xs text-gray-500">{memberIsAdmin ? 'Administrator' : 'Member'}</p>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <div className="flex gap-1">
                             {memberIsAdmin ? (
                               <button onClick={() => demoteMember(memberId)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Remove Admin"><ShieldOff className="w-4 h-4" /></button>
                             ) : (
                               <button onClick={() => promoteMember(memberId)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Make Admin"><Shield className="w-4 h-4" /></button>
                             )}
                             <button onClick={() => removeMember(memberId)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remove Member"><UserMinus className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMembersModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-200 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Members</h2>
                <p className="text-sm text-gray-500">{circle?.members?.length || 0} members in this circle</p>
              </div>
              <button 
                onClick={() => setShowMembersModal(false)} 
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search (optional future feature) */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Members List */}
            <div className="overflow-y-auto flex-1 p-2">
              {/* Admins Section */}
              {circle?.admins?.length > 0 && (
                <div className="mb-4">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Admins • {circle.admins.length}</p>
                  <div className="space-y-1">
                    {circle.admins.map((admin) => {
                      const adminId = getMemberId(admin);
                      const adminData = typeof admin === 'object' ? admin : circle.members?.find(m => getMemberId(m) === adminId);
                      const isCurrentUser = adminId === user?._id;
                      
                      return (
                        <Link
                          key={adminId}
                          to={`/profile/${adminId}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {adminData?.avatar ? (
                              <img src={adminData.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">
                                {adminData?.displayName || 'User'}
                              </p>
                              {isCurrentUser && (
                                <span className="text-xs text-gray-400">(You)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </span>
                            </div>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Regular Members Section */}
              <div>
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Members • {(circle?.members?.length || 0) - (circle?.admins?.length || 0)}
                </p>
                <div className="space-y-1">
                  {circle?.members?.filter(member => {
                    const memberId = getMemberId(member);
                    return !circle.admins?.some(admin => getMemberId(admin) === memberId);
                  }).map((member) => {
                    const memberId = getMemberId(member);
                    const isCurrentUser = memberId === user?._id;
                    
                    return (
                      <Link
                        key={memberId}
                        to={`/profile/${memberId}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {member?.avatar ? (
                            <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">
                              {member?.displayName || 'User'}
                            </p>
                            {isCurrentUser && (
                              <span className="text-xs text-gray-400">(You)</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">Member</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Empty State */}
              {(!circle?.members || circle.members.length === 0) && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No members yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}