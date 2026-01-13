import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";
import { 
  MessageCircle, Send, ArrowLeft, Search, User, Clock, 
  MoreVertical, Trash2, Shield, Check, CheckCheck, X,
  Users, Plus, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function Messages() {
  const { id: selectedUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
      loadUserProfile(selectedUserId);
    } else {
      setSelectedUser(null);
      setMessages([]);
    }
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedUserId) return;
    
    const interval = setInterval(() => {
      loadMessages(selectedUserId, true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const res = await api.get("/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
    setLoading(false);
  };

  const loadMessages = async (userId, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/messages/conversation/${userId}`);
      setMessages(res.data);
      // Reload conversations to update unread counts
      loadConversations();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("You cannot message this user");
        navigate("/messages");
      }
    }
    if (!silent) setLoading(false);
  };

  const loadUserProfile = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res = await api.get(`/users?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed:", err);
    }
    setSearchingUsers(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/messages/send/${selectedUserId}`, {
        content: newMessage.trim()
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
      loadConversations();
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send message");
    }
    setSending(false);
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(messages.filter(m => m._id !== messageId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  const startConversation = (user) => {
    setShowUserSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/messages/${user._id}`);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Messages
              {totalUnread > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h1>
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <Link
                key={conv.conversationId}
                to={`/messages/${conv.otherUser._id}`}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                  selectedUserId === conv.otherUser._id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conv.otherUser.avatar ? (
                    <img
                      src={conv.otherUser.avatar}
                      alt={conv.otherUser.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {conv.otherUser.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  {conv.otherUser.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                      {conv.otherUser.displayName}
                    </h3>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {conv.lastMessage.sender === currentUser?._id && (
                        <span className="text-gray-400 mr-1">You:</span>
                      )}
                      {conv.lastMessage.content}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No conversations yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start chatting with other members!</p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="btn text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        {selectedUserId && selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => navigate("/messages")}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              
              <Link to={`/profile/${selectedUser._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {selectedUser.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  {selectedUser.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">{selectedUser.displayName}</h2>
                  <p className="text-xs text-gray-500">
                    {selectedUser.isOnline ? (
                      <span className="text-green-600">Online</span>
                    ) : (
                      `Last seen ${formatTime(selectedUser.lastSeen)}`
                    )}
                  </p>
                </div>
              </Link>

              <Link
                to={`/profile/${selectedUser._id}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 text-gray-500" />
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length > 0 ? (
                messages.map((message, idx) => {
                  const isOwn = message.sender?._id === currentUser?._id || message.sender === currentUser?._id;
                  const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.sender?._id !== message.sender?._id);
                  
                  return (
                    <div
                      key={message._id}
                      className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwn && showAvatar && (
                        <Link to={`/profile/${selectedUser._id}`}>
                          {selectedUser.avatar ? (
                            <img
                              src={selectedUser.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                              {selectedUser.displayName?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </Link>
                      )}
                      {!isOwn && !showAvatar && <div className="w-8"></div>}
                      
                      <div className={`group relative max-w-[70%] ${isOwn ? 'order-first' : ''}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                            <span className="text-xs">{formatTime(message.createdAt)}</span>
                            {isOwn && (
                              message.read ? (
                                <CheckCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )
                            )}
                          </div>
                        </div>
                        
                        {isOwn && (
                          <button
                            onClick={() => deleteMessage(message._id)}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Start a conversation</h3>
                  <p className="text-sm text-gray-500">Send a message to {selectedUser.displayName}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {selectedUser.allowMessages ? (
              <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t border-gray-100 bg-yellow-50">
                <div className="flex items-center justify-center gap-2 text-yellow-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">This user has disabled messages</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h2>
            <p className="text-gray-500 max-w-md mb-4">
              Select a conversation or start a new one to connect with other members.
            </p>
            <button
              onClick={() => setShowUserSearch(true)}
              className="btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </button>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUserSearch(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
                <button
                  onClick={() => setShowUserSearch(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for people..."
                  autoFocus
                  onChange={(e) => searchUsers(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[50vh]">
              {searchingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => startConversation(user)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {user.displayName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{user.displayName}</h3>
                      {user.bio && (
                        <p className="text-sm text-gray-500 truncate">{user.bio}</p>
                      )}
                    </div>
                    {!user.profileVisibility?.allowMessages && (
                      <span className="text-xs text-gray-400">Messages disabled</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Users className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">Search for users to start a conversation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
