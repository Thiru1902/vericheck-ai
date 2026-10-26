import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  FileSearch,
  BellRing,
  History,
  BarChart3,
  LogOut,
  UserCheck
} from "lucide-react";
import AdvisoryBanner from "./AdvisoryBanner";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userStr = localStorage.getItem("aicte_officer_user");
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("aicte_officer_token");
    localStorage.removeItem("aicte_officer_user");
    navigate("/login");
  };

  const navLinks = [
    { to: "/", label: "Scrutiny Dashboard", icon: FileSearch },
    { to: "/alerts", label: "Pending Alerts", icon: BellRing },
    { to: "/audit", label: "Audit Trail", icon: History },
    { to: "/metrics", label: "Metrics & KPIs", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 shadow-md">
      <AdvisoryBanner />
      <div className="bg-[#0f2b48] border-b border-slate-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Council Identity */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-base tracking-tight block">
                    VeriCheck AI
                  </span>
                  <span className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase block">
                    Officer Scrutiny Console
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Officer Profile & Sign out */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-bold text-white block truncate max-w-[180px]">
                      {user.user_name || "Dr. R. K. Sharma"}
                    </span>
                    <span className="text-[10px] text-blue-300 block">AICTE Scrutiny Officer</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
