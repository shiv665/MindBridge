import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import { Bell, Check, X, Users, UserPlus, UserMinus, Shield, ExternalLink, MessageCircle, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function Notifications() {
  const [list, setList] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  
  const load = () => api.get("/notifications").then(res => setList(res.data));
  useEffect(() => { load(); }, []);
  
  const markRead = async (id) => { 
    await api.post(`/notifications/read/${id}`); 
    load(); 
  };

  const handleApprove = async (notification) => {
    setActionLoading(notification._id);
    try {
      await api.post(`/circles/${notification.meta.circleId}/requests/${notification.meta.requesterId}/approve`);
      await markRead(notification._id);
      load();
      toast.success("Request approved!");
    } catch (err) {
      toast.error("Failed to approve request");
    }
    setActionLoading(null);
  };

  const handleReject = async (notification) => {
    setActionLoading(notification._id);
    try {
      await api.post(`/circles/${notification.meta.circleId}/requests/${notification.meta.requesterId}/reject`);
      await markRead(notification._id);
      load();
      toast.success("Request rejected");
    } catch (err) {
      toast.error("Failed to reject request");
    }
    setActionLoading(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "Join Request":
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case "Request Approved":
        return <Check className="w-5 h-5 text-green-600" />;
      case "Request Declined":
        return <X className="w-5 h-5 text-red-600" />;
      case "Removed from Circle":
        return <UserMinus className="w-5 h-5 text-red-600" />;
      case "Promoted to Admin":
        return <Shield className="w-5 h-5 text-purple-600" />;
      case "new_post":
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case "new_comment":
        return <MessageCircle className="w-5 h-5 text-teal-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case "Join Request":
        return "bg-blue-100";
      case "Request Approved":
        return "bg-green-100";
      case "Request Declined":
        return "bg-red-100";
      case "Removed from Circle":
        return "bg-red-100";
      case "Promoted to Admin":
        return "bg-purple-100";
      case "new_post":
        return "bg-indigo-100";
      case "new_comment":
        return "bg-teal-100";
      default:
        return "bg-gray-100";
    }
  };

  const unreadCount = list.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-blue-600 text-white text-sm font-medium rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {list.length > 0 ? list.map((notification) => (
          <div 
            key={notification._id}
            className={`p-4 flex items-start gap-4 ${
              notification.read ? 'bg-white' : 'bg-blue-50/50'
            } hover:bg-gray-50 transition-colors`}
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBg(notification.type)}`}>
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                  {notification.type || 'Update'}
                </span>
                {!notification.read && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                    New
                  </span>
                )}
              </div>
              <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              
              {/* Action buttons for join requests */}
              {notification.meta?.actionType === "join_request" && !notification.read && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleApprove(notification)}
                    disabled={actionLoading === notification._id}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(notification)}
                    disabled={actionLoading === notification._id}
                    className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </button>
                </div>
              )}

              {/* Link to circle for approved/promoted/new post/new comment notifications */}
              {(notification.meta?.actionType === "request_approved" || 
                notification.meta?.actionType === "promoted_to_admin" ||
                notification.type === "new_post" ||
                notification.type === "new_comment") && notification.meta?.circleId && (
                <Link
                  to={`/circles/${notification.meta.circleId}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mt-2"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Go to Circle
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              )}
            </div>
            
            {!notification.read && notification.meta?.actionType !== "join_request" && (
              <button 
                onClick={() => markRead(notification._id)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Mark as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        )) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
            <p className="text-gray-500 text-sm">No notifications yet.</p>
          </div>
        )}
      </div>

      {/* Stats */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{list.length}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Read</p>
                <p className="text-2xl font-semibold text-gray-900">{list.length - unreadCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}