import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/erp/StatCard";
import { Badge } from "@/components/erp/Badge";
import { currentShamsiYear, todayAfghan } from "@/lib/afghan-date";
import {
  Users, GraduationCap, BookOpen, Wallet, Receipt,
  CalendarCheck, AlertCircle, BookText, BadgeDollarSign, UserCog, Banknote,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line,
} from "recharts";
import * as dashboardApi from "@/data/dashboardApi";
import { toast } from "sonner";
import { ErpLoader } from "@/components/erp/ErpLoader";
import { ShamsiYearPicker } from "@/components/erp/ShamsiYearPicker";

// Helper function to format numbers
const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  if (num % 1 === 0) return num.toLocaleString('en-US');
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Helper function to format currency
const formatCurrency = (num) => {
  if (typeof num !== 'number') return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  if (num % 1 === 0) return num.toLocaleString('en-US');
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const PIE_COLORS = ["hsl(152,55%,40%)", "hsl(0,72%,51%)", "hsl(38,92%,50%)"];

const CHART_COLORS = {
  all: { revenue: "hsl(222,30%,20%)", expense: "hsl(0,72%,51%)", student: "hsl(222,30%,20%)", expenseBar: "hsl(217,70%,50%)" },
  school: { revenue: "hsl(152,55%,40%)", expense: "hsl(199,100%,33%)", student: "hsl(152,55%,40%)", expenseBar: "hsl(199,100%,33%)" },
  center: { revenue: "hsl(38,92%,50%)", expense: "hsl(45,100%,45%)", student: "hsl(38,92%,50%)", expenseBar: "hsl(45,100%,45%)" },
  madrasa: { revenue: "hsl(0,72%,51%)", expense: "hsl(330,84%,45%)", student: "hsl(0,72%,51%)", expenseBar: "hsl(330,84%,45%)" },
};

const VIEWS = [
  { key: "all", label: "ټول" },
  { key: "school", label: "ښوونځي" },
  { key: "center", label: "مرکز" },
  { key: "madrasa", label: "مدرسه" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState("all");
  
  // Data states - no loading states, render immediately
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [attData, setAttData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [studentComparisonData, setStudentComparisonData] = useState([]);
  const [financialSummaryData, setFinancialSummaryData] = useState([]);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  
  const curYear = currentShamsiYear();
  const [selectedYear, setSelectedYear] = useState(String(curYear));
  const selectedLabel = VIEWS.find((v) => v.key === view)?.label;
  const CARD_GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3";

  const getCardsForView = () => {
    if (!overview) return [];

    if (view === "all") {
      return [
        { label: "ټول زده کوونکي", value: formatNumber(overview.students?.total || 0), icon: <Users className="size-5" />, accent: "info", to: "/students" },
        { label: "د ښوونځي", value: formatNumber(overview.students?.school || 0), icon: <Users className="size-5" />, to: "/students" },
        { label: "د مرکز", value: formatNumber(overview.students?.center || 0), icon: <Users className="size-5" />, to: "/students" },
        { label: "د مدرسې", value: formatNumber(overview.students?.madrasa || 0), icon: <Users className="size-5" />, to: "/students" },
        { label: "ښوونکي", value: formatNumber(overview.teachers || 0), icon: <GraduationCap className="size-5" />, accent: "info", to: "/teachers" },
        { label: "ټولګي", value: formatNumber(overview.classes || 0), icon: <BookOpen className="size-5" />, to: "/classes" },
        { label: "مضامین", value: formatNumber(overview.subjects || 0), icon: <BookText className="size-5" />, to: "/subjects" },
        { label: "میاشتنی عاید", value: formatCurrency(overview.revenue?.monthly || 0), icon: <Wallet className="size-5" />, accent: "success", to: "/revenue" },
        { label: "ورځنی عاید", value: formatCurrency(overview.revenue?.daily || 0), icon: <BadgeDollarSign className="size-5" />, accent: "success", to: "/revenue" },
        { label: "ورځني لګښتونه", value: formatCurrency(overview.expenses?.daily || 0), icon: <Receipt className="size-5" />, accent: "warning", to: "/expenses" },
        { label: "میاشتني لګښتونه", value: formatCurrency(overview.expenses?.monthly || 0), icon: <Receipt className="size-5" />, accent: "warning", to: "/expenses" },
        { label: "کلني لګښتونه", value: formatCurrency(overview.expenses?.yearly || 0), icon: <Receipt className="size-5" />, accent: "warning", to: "/expenses" },
        { label: "د حاضرۍ سلنه", value: `${overview.attendancePercentage || 0}%`, icon: <CalendarCheck className="size-5" />, accent: "info", to: "/attendance/students" },
        { label: "نه ورکړل شوي فیسونه", value: formatNumber(overview.unpaidFees || 0), icon: <AlertCircle className="size-5" />, accent: "destructive", to: "/revenue" },
        { label: "کارمندان", value: formatNumber(overview.staff || 0), icon: <UserCog className="size-5" />, to: "/staff" },
        { label: "ټول معاشونه", value: formatCurrency(overview.salaries?.total || 0), icon: <Banknote className="size-5" />, accent: "warning", to: "/salaries" },
        { label: "د کارمندانو معاشونه", value: formatCurrency(overview.salaries?.staff || 0), icon: <Banknote className="size-5" />, to: "/salaries" },
        { label: "د ښوونکو معاشونه", value: formatCurrency(overview.salaries?.teachers || 0), icon: <Banknote className="size-5" />, to: "/salaries" },
      ];
    }

    return [
      { label: "زده کوونکي", value: formatNumber(overview.students || 0), icon: <Users className="size-5" />, accent: "info", to: "/students" },
      { label: "ښوونکي", value: formatNumber(overview.teachers || 0), icon: <GraduationCap className="size-5" />, accent: "info", to: "/teachers" },
      { label: "ټولګي", value: formatNumber(overview.classes || 0), icon: <BookOpen className="size-5" />, to: "/classes" },
      { label: "مضامین", value: formatNumber(overview.subjects || 0), icon: <BookText className="size-5" />, to: "/subjects" },
      { label: "کارمندان", value: formatNumber(overview.staff || 0), icon: <UserCog className="size-5" />, to: "/staff" },
      { label: "د حاضرۍ سلنه", value: `${overview.attendancePercentage || 0}%`, icon: <CalendarCheck className="size-5" />, accent: "info", to: "/attendance/students" },
      { label: "میاشتنی عاید", value: formatCurrency(overview.revenue?.monthly || 0), icon: <Wallet className="size-5" />, accent: "success", to: "/revenue" },
      { label: "ورځنی عاید", value: formatCurrency(overview.revenue?.daily || 0), icon: <BadgeDollarSign className="size-5" />, accent: "success", to: "/revenue" },
      { label: "ورځني لګښتونه", value: formatCurrency(overview.expenses?.daily || 0), icon: <Receipt className="size-5" />, accent: "warning", to: "/expenses" },
      { label: "میاشتني لګښتونه", value: formatCurrency(overview.expenses?.monthly || 0), icon: <Receipt className="size-5" />, accent: "warning", to: "/expenses" },
      { label: "کلني لګښتونه", value: formatCurrency(overview.expenses?.yearly || 0), icon: <Receipt className="size-5" />, accent: "warning", to: "/expenses" },
      { label: "نه ورکړل شوي فیسونه", value: formatNumber(overview.unpaidFees || 0), icon: <AlertCircle className="size-5" />, accent: "destructive", to: "/revenue" },
      { label: "ټول معاشونه", value: formatCurrency(overview.salaries?.total || 0), icon: <Banknote className="size-5" />, accent: "warning", to: "/salaries" },
      { label: "د کارمندانو معاش", value: formatCurrency(overview.salaries?.staff || 0), icon: <Banknote className="size-5" />, accent: "warning", to: "/salaries" },
      { label: "د ښوونکو معاش", value: formatCurrency(overview.salaries?.teachers || 0), icon: <Banknote className="size-5" />, accent: "warning", to: "/salaries" },
    ];
  };

  useEffect(() => {
    loadDashboardData();
  }, [view, selectedYear]);

  const loadDashboardData = async () => {
    // Load cards first
    dashboardApi.getDashboardCards(view, selectedYear)
      .then(cardsRes => setOverview(cardsRes.data))
      .catch(error => {
        console.error("Cards load error:", error);
        toast.error("د کارډونو معلومات نه شي ترلاسه کیدای");
      });

    // Load charts in parallel - passing selectedYear to all chart APIs
    Promise.all([
      dashboardApi.getRevenueExpenseChart(view, 5, selectedYear),
      dashboardApi.getAttendanceChart(view, selectedYear),
      dashboardApi.getStudentGrowthChart(view, 6, selectedYear),
      dashboardApi.getMonthlyExpensesChart(view, 5, selectedYear),
      dashboardApi.getYearlyStudentComparisonChart(view, selectedYear),
      dashboardApi.getFinancialSummaryChart(view, 12, selectedYear),
    ])
      .then(([revenueRes, attendanceRes, growthRes, expensesRes, comparisonRes, financialRes]) => {
        setRevenueData(revenueRes.data || []);
        setAttData(attendanceRes.data || []);
        setGrowthData(growthRes.data || []);
        setExpensesData(expensesRes.data || []);
        setStudentComparisonData(comparisonRes.data || []);
        setFinancialSummaryData(financialRes.data || []);
      })
      .catch(error => {
        console.error("Charts load error:", error);
        toast.error("د چارټونو معلومات نه شي ترلاسه کیدای");
      });

    // Load lists and status - passing selectedYear
    Promise.all([
      dashboardApi.getRecentAdmissions(view, 10, selectedYear),
      dashboardApi.getUpcomingExams(view, 5, selectedYear),
      dashboardApi.getSystemStatus(),
    ])
      .then(([admissionsRes, examsRes, statusRes]) => {
        setRecentAdmissions(admissionsRes.data || []);
        setUpcomingExams(examsRes.data || []);
        setSystemStatus(statusRes.data);
      })
      .catch(error => {
        console.error("Lists load error:", error);
      });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">ډشبورډ</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {selectedLabel} · د {selectedYear} تعلیمي کال · {todayAfghan()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="min-w-[170px]">
            <ShamsiYearPicker value={selectedYear} onChange={(v) => setSelectedYear(v)} placeholder="کال وټاکئ" />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${
                  view === v.key
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CARDS SECTION */}
      {overview && (
        <div className={CARD_GRID_CLASS}>
          {getCardsForView().map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              accent={card.accent}
              onClick={() => navigate(card.to)}
            />
          ))}
        </div>
      )}

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-md p-4 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">عاید په پرتله د لګښت</h3>
            <span className="text-xs text-muted-foreground">وروستۍ ۵ میاشتې</span>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gRev" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[view]?.revenue || CHART_COLORS.all.revenue} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS[view]?.revenue || CHART_COLORS.all.revenue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[view]?.expense || CHART_COLORS.all.expense} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_COLORS[view]?.expense || CHART_COLORS.all.expense} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Area dataKey="revenue" name="عاید" stroke={CHART_COLORS[view]?.revenue || CHART_COLORS.all.revenue} fill="url(#gRev)" strokeWidth={2} />
                <Area dataKey="expense" name="لګښت" stroke={CHART_COLORS[view]?.expense || CHART_COLORS.all.expense} fill="url(#gExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-[240px] text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="font-semibold text-sm mb-3">د نن ورځې حاضري · {todayAfghan()}</h3>
          {attData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={attData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {attData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-[240px] text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="font-semibold text-sm mb-3">د زده کوونکو وده</h3>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="students" name="زده کوونکي" stroke={CHART_COLORS[view]?.student || CHART_COLORS.all.student} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-[200px] text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
          )}
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="font-semibold text-sm mb-3">د میاشتو لګښتونه</h3>
          {expensesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={expensesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="expense" name="لګښت" fill={CHART_COLORS[view]?.expenseBar || CHART_COLORS.all.expenseBar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-[200px] text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="font-semibold text-sm mb-3">تېر کال او سږ کال د زده کوونکو پرتله</h3>
          {studentComparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={studentComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="thisYear" name="سږ کال" stroke="hsl(152,55%,40%)" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="lastYear" name="تېر کال" stroke="hsl(0,72%,51%)" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-[220px] text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
          )}
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="font-semibold text-sm mb-3">میاشتنی مالي لنډیز (عاید، معاش، لګښت)</h3>
          {financialSummaryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={financialSummaryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="عاید" stroke="hsl(217,70%,50%)" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="salaries" name="معاشونه" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="expenses" name="لګښتونه" stroke="hsl(0,72%,51%)" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-[220px] text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
          )}
        </div>
      </div>

      {/* LISTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-md md:col-span-2">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">وروستي شامل شوي</h3>
            <span className="text-xs text-muted-foreground">{recentAdmissions.length} داخلې</span>
          </div>
          {recentAdmissions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
          ) : (
            <div className="divide-y divide-border">
              {recentAdmissions.map((student) => (
                <div key={student.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/students/${student.id}`)}>
                  <div>
                    <p className="text-sm font-medium">{student.fullName}</p>
                    <p className="text-xs text-muted-foreground">{student.className} {student.classSection ? `- ${student.classSection}` : ""}</p>
                  </div>
                  <Badge variant="outline">{student.classType}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">د سیسټم حالت</h3>
          </div>
          {systemStatus ? (
            <ul className="space-y-2 p-4 text-sm">
              {systemStatus && Object.entries(systemStatus).map(([key, value]) => (
                <li key={key} className="flex items-center justify-between border border-border rounded p-2">
                  <span>{key === "frontend" ? "فرانټ اینډ" : key === "backend" ? "بیک اینډ" : "ډیټابیس"}</span>
                  <Badge variant={value.variant}>{value.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex justify-center py-8 text-sm text-muted-foreground">معلومات ترلاسه کیږي...</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="font-semibold text-sm mb-3">راتلونکې ازموینې</h3>
          {upcomingExams.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">معلومات ترلاسه کیږي...</div>
          ) : (
            <div className="space-y-2">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="border border-border rounded p-3 hover:bg-muted/50 cursor-pointer" onClick={() => navigate("/exams")}>
                  <p className="text-sm font-medium">{exam.examTitle}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{exam.startDate}</span>
                    <Badge variant="outline">{exam.institutionType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
