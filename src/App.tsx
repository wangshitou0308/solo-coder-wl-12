import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SleepPage from "@/pages/SleepPage";
import DreamPage from "@/pages/DreamPage";
import AnalysisPage from "@/pages/AnalysisPage";
import DashboardPage from "@/pages/DashboardPage";
import ToolsPage from "@/pages/ToolsPage";
import TimelinePage from "@/pages/TimelinePage";
import ReportPage from "@/pages/ReportPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/sleep" replace />} />
          <Route path="/sleep" element={<SleepPage />} />
          <Route path="/dream" element={<DreamPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/report" element={<ReportPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
