import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "react-router-dom";
import Nav from "./Nav";

export default function Layout({ children }) {
  const { token, fetchMe } = useAuth();
  const location = useLocation();
  
  useEffect(() => { if (token) fetchMe(); }, [token, fetchMe]);
  
  // Check if current page is login or register (auth pages)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // For auth pages, render without nav/layout
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}