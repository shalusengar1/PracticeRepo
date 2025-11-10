import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import UserManagement from "@/pages/UserManagement";
import VenueManagement from "@/pages/VenueManagement";
import BatchManagement from "@/pages/BatchManagement";
import PartnerManagement from "@/pages/PartnerManagement";
import MemberManagement from "@/pages/MemberManagement";
import StudentTeacherManagement from "@/pages/StudentTeacherManagement";
import ActivityLogs from "@/pages/ActivityLogs";
import Profile from "@/pages/Profile";
import AddNewUser from "@/pages/AddNewUser";
import EditUser from "@/pages/EditUser";
import NotFound from "@/pages/NotFound";
import ProgramSettings from "@/pages/ProgramSettings";
import FixedAssetsManagement from "@/pages/FixedAssetsManagement";
import SignIn from "@/pages/SignIn";
import ProtectedRoute from "./routes/ProtectedRoute";
import { Provider } from "react-redux";
import { store } from "./store/store";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/users/new" element={<AddNewUser />} />
            <Route path="/users/edit/:id" element={<EditUser />} />
            <Route path="/venues" element={<VenueManagement />} />
            <Route path="/batches" element={<BatchManagement />} />
            <Route path="/partners" element={<PartnerManagement />} />
            <Route path="/members" element={<MemberManagement />} />
            <Route path="/students-teachers" element={<StudentTeacherManagement />} />
            <Route path="/activity-logs" element={<ActivityLogs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings/assets" element={<FixedAssetsManagement />} />
            <Route path="/settings/:section" element={<ProgramSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </Provider>
);

export default App;