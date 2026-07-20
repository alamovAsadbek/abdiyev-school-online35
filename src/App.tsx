import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {AuthProvider, useAuth} from "@/contexts/AuthContext";
import {ThemeProvider} from "@/contexts/ThemeContext";
import {ProgressProvider} from "@/contexts/ProgressContext";
import {SidebarProvider} from "@/contexts/SidebarContext";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCategoryView from "./pages/student/StudentCategoryView";
import StudentVideos from "./pages/student/StudentVideos";
import StudentVideoView from "./pages/student/StudentVideoView";
import StudentTasks from "./pages/student/StudentTasks";
import StudentTaskView from "./pages/student/StudentTaskView";
import StudentSubmissionDetail from "./pages/student/StudentSubmissionDetail";
import StudentProfile from "./pages/student/StudentProfile";
import StudentCheckout from "./pages/student/StudentCheckout";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCategoryCreate from "./pages/admin/AdminCategoryCreate";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminVideoAdd from "./pages/admin/AdminVideoAdd";
import AdminVideoAddWithTask from "./pages/admin/AdminVideoAddWithTask";
import AdminVideoDetail from "./pages/admin/AdminVideoDetail";
import AdminVideoEdit from "./pages/admin/AdminVideoEdit";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminUserEdit from "./pages/admin/AdminUserEdit";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPaymentDetail from "./pages/admin/AdminPaymentDetail";
import AdminCategoryDetail from "./pages/admin/AdminCategoryDetail";
import AdminModuleEdit from "./pages/admin/AdminModuleEdit";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminNotificationCreate from "./pages/admin/AdminNotificationCreate";
import AdminTaskStatistics from "@/pages/admin/AdminTaskStatistics.tsx";
import AdminSubmissionDetail from "@/pages/admin/AdminSubmissionDetail.tsx";
import AdminTaskDetail from "@/pages/admin/AdminTaskDetail.tsx";
import AdminTaskCreate from "@/pages/admin/AdminTaskCreate.tsx";


const queryClient = new QueryClient();

// Faqat admin uchun himoya
function AdminRoute({children}: { children: React.ReactNode }) {
    const {user, isLoading} = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" replace/>;
    }

    return <>{children}</>;
}

// Login/register sahifasi - agar allaqachon login qilingan bo'lsa, o'z panel'iga o'tkazadi
function AuthRoute({children}: { children: React.ReactNode }) {
    const {user, isLoading} = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
            </div>
        );
    }

    if (user) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace/>;
    }

    return <>{children}</>;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<AuthRoute><Login/></AuthRoute>}/>

            {/* Student Routes - LOGIN SHART EMAS. Har bir sahifa o'zi ichida
                user bor/yo'qligini useAuth() orqali tekshiradi va pullik/shaxsiy
                joylarda "kirish kerak" holatini ko'rsatadi. */}
            <Route path="/" element={<StudentDashboard/>}/>
            <Route path="/student" element={<StudentDashboard/>}/>
            <Route path="/student/profile" element={<StudentProfile/>}/>
            <Route path="/student/courses" element={<StudentCourses/>}/>
            <Route path="/student/categories" element={<StudentCourses/>}/>
            <Route path="/student/category/:categoryId" element={<StudentCategoryView/>}/>
            <Route path="/student/videos" element={<StudentVideos/>}/>
            <Route path="/student/video/:videoId" element={<StudentVideoView/>}/>
            <Route path="/student/tasks" element={<StudentTasks/>}/>
            <Route path="/student/task/:taskId" element={<StudentTaskView/>}/>
            <Route path="/student/submission/:submissionId" element={<StudentSubmissionDetail/>}/>
            <Route path="/student/checkout" element={<StudentCheckout/>}/>

            {/* Admin Routes - login shart, faqat admin */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>}/>
            <Route path="/admin/users" element={<AdminRoute><AdminUsers/></AdminRoute>}/>
            <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserDetail/></AdminRoute>}/>
            <Route path="/admin/users/:userId/edit" element={<AdminRoute><AdminUserEdit/></AdminRoute>}/>
            <Route path="/admin/payments" element={<AdminRoute><AdminPayments/></AdminRoute>}/>
            <Route path="/admin/payments/:paymentId" element={<AdminRoute><AdminPaymentDetail/></AdminRoute>}/>
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories/></AdminRoute>}/>
            <Route path="/admin/categories/create" element={<AdminRoute><AdminCategoryCreate/></AdminRoute>}/>
            <Route path="/admin/categories/:categoryId" element={<AdminRoute><AdminCategoryDetail/></AdminRoute>}/>
            <Route path="/admin/categories/:categoryId/edit" element={<AdminRoute><AdminCategoryCreate/></AdminRoute>}/>
            <Route path="/admin/categories/:categoryId/modules/:moduleId/edit" element={<AdminRoute><AdminModuleEdit/></AdminRoute>}/>
            <Route path="/admin/videos" element={<AdminRoute><AdminVideos/></AdminRoute>}/>
            <Route path="/admin/videos/add" element={<AdminRoute><AdminVideoAddWithTask/></AdminRoute>}/>
            <Route path="/admin/videos/add-old" element={<AdminRoute><AdminVideoAdd/></AdminRoute>}/>
            <Route path="/admin/videos/:videoId" element={<AdminRoute><AdminVideoDetail/></AdminRoute>}/>
            <Route path="/admin/videos/:videoId/edit" element={<AdminRoute><AdminVideoEdit/></AdminRoute>}/>
            <Route path="/admin/tasks" element={<AdminRoute><AdminTasks/></AdminRoute>}/>
            <Route path="/admin/tasks/create" element={<AdminRoute><AdminTaskCreate/></AdminRoute>}/>
            <Route path="/admin/tasks/:taskId" element={<AdminRoute><AdminTaskDetail/></AdminRoute>}/>
            <Route path="/admin/tasks/:taskId/stats" element={<AdminRoute><AdminTaskStatistics/></AdminRoute>}/>
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications/></AdminRoute>}/>
            <Route path="/admin/notifications/create" element={<AdminRoute><AdminNotificationCreate/></AdminRoute>}/>
            <Route path="/admin/submissions/:submissionId" element={<AdminRoute><AdminSubmissionDetail/></AdminRoute>}/>

            {/* 404 */}
            <Route path="*" element={<NotFound/>}/>
        </Routes>
    );
}

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <AuthProvider>
                <ProgressProvider>
                    <SidebarProvider>
                        <TooltipProvider>
                            <Toaster/>
                            <Sonner/>
                            <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                                <AppRoutes/>
                            </BrowserRouter>
                        </TooltipProvider>
                    </SidebarProvider>
                </ProgressProvider>
            </AuthProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;