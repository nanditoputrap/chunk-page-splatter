import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AmaliyahProvider } from "@/context/AmaliyahContext";
import Navbar from "@/components/Navbar";
import NotificationToast from "@/components/NotificationToast";
import HomePage from "./pages/HomePage";
import ClassSelectPage from "./pages/ClassSelectPage";
import StudentSelectPage from "./pages/StudentSelectPage";
import FormPage from "./pages/FormPage";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => (
  <div className="min-h-screen font-sans text-foreground relative selection:bg-primary/20 pb-10">
    <div className="bg-blob" />
    <Navbar />
    <main>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/classes" element={<ClassSelectPage />} />
        <Route path="/students" element={<StudentSelectPage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/dashboard" element={<TeacherDashboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <NotificationToast />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AmaliyahProvider>
          <AppLayout />
        </AmaliyahProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
