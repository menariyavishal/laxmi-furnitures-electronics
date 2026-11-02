"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AnalyticsDashboard() {
  const { role, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [days, setDays] = useState("30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/dashboard");
      return;
    }
    if (days !== "custom") {
      loadData();
    }
  }, [authLoading, role, days]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      let query = `days=${days}`;
      if (days === "custom" && startDate && endDate) {
        query = `startDate=${startDate}&endDate=${endDate}`;
      }

      const [statsRes, chartsRes] = await Promise.all([
        fetch(`/api/v1/analytics/stats?${query}`),
        fetch(`/api/v1/analytics/charts?${query}`),
      ]);

      if (!statsRes.ok || !chartsRes.ok) {
        throw new Error("Failed to load analytics data");
      }

      const statsData = await statsRes.json();
      const chartsData = await chartsRes.json();

      setStats(statsData);
      setCharts(chartsData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    let query = `days=${days}`;
    if (days === "custom" && startDate && endDate) {
      query = `startDate=${startDate}&endDate=${endDate}`;
    }
    window.open(`/api/v1/analytics/export?${query}`, "_blank");
  };

  if (authLoading || role !== "owner") return null;

  return (
    <div className="space-y-6">
      {/* Top Bar - Elevated z-30 stacking context so dropdown floats above lower cards */}
      <div className="relative z-30 flex justify-between items-center bg-[#F5F2ED]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#E5DFD7]">
        <div>
          <h2 className="text-2xl font-black text-[#1C1A17] tracking-tight">Business Analytics</h2>
          <p className="text-sm text-[#6E6862]">Sales and profit metrics dashboard</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="border border-[#DDD6CE] rounded-xl px-4 py-2 bg-white text-sm min-w-[150px] text-left flex justify-between items-center text-[#1C1A17] font-bold hover:border-[#D5CDC3] transition shadow-2xs"
            >
              {days === "custom" ? "Custom Range" : `Last ${days} Days`}
              <span className="ml-2 text-[#6E6862] text-xs">▼</span>
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 bg-[#F5F2ED] border border-[#DDD6CE] rounded-2xl shadow-2xl z-50 w-80 p-3">
                <div className="flex flex-col space-y-1">
                  <button onClick={() => { setDays("7"); setDropdownOpen(false); }} className={`text-left px-3 py-2 text-sm rounded-xl font-bold transition ${days === "7" ? "bg-[#1C1A17] text-white shadow-xs" : "text-[#6E6862] hover:bg-[#EAE4DC] hover:text-[#1C1A17]"}`}>Last 7 Days</button>
                  <button onClick={() => { setDays("30"); setDropdownOpen(false); }} className={`text-left px-3 py-2 text-sm rounded-xl font-bold transition ${days === "30" ? "bg-[#1C1A17] text-white shadow-xs" : "text-[#6E6862] hover:bg-[#EAE4DC] hover:text-[#1C1A17]"}`}>Last 30 Days</button>
                  <button onClick={() => { setDays("90"); setDropdownOpen(false); }} className={`text-left px-3 py-2 text-sm rounded-xl font-bold transition ${days === "90" ? "bg-[#1C1A17] text-white shadow-xs" : "text-[#6E6862] hover:bg-[#EAE4DC] hover:text-[#1C1A17]"}`}>Last 90 Days</button>
                </div>
                
                <div className="mt-3 pt-3 border-t border-[#E5DFD7]">
                  <span className="text-xs font-bold text-[#6E6862] mb-2 block px-2 uppercase tracking-wider">Custom Range</span>
                  <div className="flex items-center gap-2 px-2">
                    <div className="flex flex-col w-full">
                      <span className="text-[10px] font-bold text-[#6E6862] mb-0.5">From</span>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="border border-[#DDD6CE] bg-white rounded-lg px-2 py-1.5 text-xs text-[#1C1A17] font-semibold w-full outline-none focus:border-[#1C1A17]"
                      />
                    </div>
                    <span className="text-[#6E6862] mt-4 font-bold">→</span>
                    <div className="flex flex-col w-full">
                      <span className="text-[10px] font-bold text-[#6E6862] mb-0.5">To</span>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="border border-[#DDD6CE] bg-white rounded-lg px-2 py-1.5 text-xs text-[#1C1A17] font-semibold w-full outline-none focus:border-[#1C1A17]"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      setDays("custom"); 
                      loadData();
                      setDropdownOpen(false); 
                    }}
                    disabled={!startDate || !endDate}
                    className="mt-3 w-full bg-[#1C1A17] hover:bg-[#2C2926] text-white text-xs font-bold py-2 rounded-xl transition shadow-xs disabled:bg-[#DDD6CE] disabled:text-[#6E6862]"
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExportExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded text-sm transition"
          >
            Export Excel
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}

      {/* Stats Cards */}
      {loading || !stats ? (
        <div className="grid grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#F5F2ED]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#E5DFD7] border-l-4 border-l-blue-500">
            <span className="text-sm font-medium text-gray-500 block">Total Revenue</span>
            <span className="text-3xl font-bold text-gray-900 mt-2 block">₹{stats.totalSales}</span>
          </div>
          <div className="bg-[#F5F2ED]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#E5DFD7] border-l-4 border-l-emerald-500">
            <span className="text-sm font-medium text-gray-500 block">Total Profit Margin</span>
            <span className="text-3xl font-bold text-gray-900 mt-2 block">₹{stats.totalProfit}</span>
          </div>
          <div className="bg-[#F5F2ED]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#E5DFD7] border-l-4 border-l-purple-500">
            <span className="text-sm font-medium text-gray-500 block">Bills Generated</span>
            <span className="text-3xl font-bold text-gray-900 mt-2 block">{stats.totalBills}</span>
          </div>
          <div className="bg-[#F5F2ED]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#E5DFD7] border-l-4 border-l-rose-500">
            <span className="text-sm font-medium text-gray-500 block">Low Stock Warnings</span>
            <span className="text-3xl font-bold text-red-600 mt-2 block">{stats.lowStockCount}</span>
          </div>
        </div>
      )}

      {/* Charts section */}
      {loading || !charts ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm h-96 animate-pulse" />
          <div className="bg-white p-6 rounded-lg shadow-sm h-96 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend Chart */}
          <div className="col-span-1 lg:col-span-2 bg-[#F5F2ED]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#E5DFD7]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue & Profit Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.salesTrend}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#82ca9d" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="bg-[#F5F2ED]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#E5DFD7]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Volume Distribution</h3>
            <div className="h-80 flex flex-col justify-between">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {charts.paymentData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Total distribution by transaction volume (Rs.)
              </div>
            </div>
          </div>

          {/* Category distribution */}
          <div className="col-span-1 lg:col-span-3 bg-[#F5F2ED]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#E5DFD7]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Category-Wise Sales</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Bar dataKey="value" fill="#0088FE" name="Sales Volume (₹)">
                    {charts.categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-gray-400 text-left italic">
              * Note: Shows Gross Product Volume. Taxes are included and bill discounts are not subtracted.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
