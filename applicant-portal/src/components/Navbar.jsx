import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, PlusCircle, LayoutDashboard, LogOut, Building2 } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("aicte_applicant_user");
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("aicte_applicant_token");
    localStorage.removeItem("aicte_applicant_user");
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-emerald-100 shadow-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 text-base tracking-tight block">
                  VeriCheck AI
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold tracking-wider uppercase block">
                  College Applicant Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Current Institution Badge */}
          {user && (
            <div className="hidden md:flex items-center gap-3 bg-emerald-50/80 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl text-xs">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-gray-900 block truncate max-w-xs">
                  {user.institution_name || user.user_name}
                </span>
                <span className="text-[11px] text-emerald-700 font-mono">
                  PID: {user.institution_perm_id || "1-3324567891"}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">My Applications</span>
            </Link>

            <Link
              to="/new-application"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs hover:shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Application</span>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
