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
import Landing from "./pages/Landing";
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
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminTaskStatistics from "@/pages/admin/AdminTaskStatistics.tsx";
import AdminSubmissionDetail from "@/pages/admin/AdminSubmissionDetail.tsx";
import AdminTaskDetail from "@/pages/admin/AdminTaskDetail.tsx";
import AdminTaskCreate from "@/pages/admin/AdminTaskCreate.tsx";


const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({children, allowedRole}: { children: React.ReactNode; allowedRole?: 'admin' | 'student' }) {
    const {user, isLoading} = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace/>;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace/>;
    }

    return <>{children}</>;
}

// Auth Route - Redirect if already logged in
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
            {/* Public Routes */}
            <Route path="/" element={<Landing/>}/>
            <Route path="/login" element={<AuthRoute><Login/></AuthRoute>}/>

            {/* Student Routes */}
            <Route path="/student"
                   element={<ProtectedRoute allowedRole="student"><StudentDashboard/></ProtectedRoute>}/>
            <Route path="/student/profile"
                   element={<ProtectedRoute allowedRole="student"><StudentProfile/></ProtectedRoute>}/>
            <Route path="/student/courses"
                   element={<ProtectedRoute allowedRole="student"><StudentCourses/></ProtectedRoute>}/>
            <Route path="/student/categories"
                   element={<ProtectedRoute allowedRole="student"><StudentCourses/></ProtectedRoute>}/>
            <Route path="/student/category/:categoryId"
                   element={<ProtectedRoute allowedRole="student"><StudentCategoryView/></ProtectedRoute>}/>
            <Route path="/student/videos"
                   element={<ProtectedRoute allowedRole="student"><StudentVideos/></ProtectedRoute>}/>
            <Route path="/student/video/:videoId"
                   element={<ProtectedRoute allowedRole="student"><StudentVideoView/></ProtectedRoute>}/>
            <Route path="/student/tasks"
                   element={<ProtectedRoute allowedRole="student"><StudentTasks/></ProtectedRoute>}/>
            <Route path="/student/task/:taskId"
                   element={<ProtectedRoute allowedRole="student"><StudentTaskView/></ProtectedRoute>}/>
            <Route path="/student/submission/:submissionId"
                   element={<ProtectedRoute allowedRole="student"><StudentSubmissionDetail/></ProtectedRoute>}/>
            <Route path="/student/checkout"
                   element={<ProtectedRoute allowedRole="student"><StudentCheckout/></ProtectedRoute>}/>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard/></ProtectedRoute>}/>
            <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminUsers/></ProtectedRoute>}/>
            <Route path="/admin/users/:userId"
                   element={<ProtectedRoute allowedRole="admin"><AdminUserDetail/></ProtectedRoute>}/>
            <Route path="/admin/users/:userId/edit"
                   element={<ProtectedRoute allowedRole="admin"><AdminUserEdit/></ProtectedRoute>}/>
            <Route path="/admin/payments"
                   element={<ProtectedRoute allowedRole="admin"><AdminPayments/></ProtectedRoute>}/>
            <Route path="/admin/payments/:paymentId"
                   element={<ProtectedRoute allowedRole="admin"><AdminPaymentDetail/></ProtectedRoute>}/>

            <Route path="/admin/categories"
                   element={<ProtectedRoute allowedRole="admin"><AdminCategories/></ProtectedRoute>}/>
            <Route path="/admin/categories/create"
                   element={<ProtectedRoute allowedRole="admin"><AdminCategoryCreate/></ProtectedRoute>}/>
            <Route path="/admin/categories/:categoryId"
                   element={<ProtectedRoute allowedRole="admin"><AdminCategoryDetail/></ProtectedRoute>}/>
            <Route path="/admin/categories/:categoryId/edit"
                   element={<ProtectedRoute allowedRole="admin"><AdminCategoryCreate/></ProtectedRoute>}/>
            <Route path="/admin/videos" element={<ProtectedRoute allowedRole="admin"><AdminVideos/></ProtectedRoute>}/>
            <Route path="/admin/videos/add"
                   element={<ProtectedRoute allowedRole="admin"><AdminVideoAddWithTask/></ProtectedRoute>}/>
            <Route path="/admin/videos/add-old"
                   element={<ProtectedRoute allowedRole="admin"><AdminVideoAdd/></ProtectedRoute>}/>
            <Route path="/admin/videos/:videoId"
                   element={<ProtectedRoute allowedRole="admin"><AdminVideoDetail/></ProtectedRoute>}/>
            <Route path="/admin/videos/:videoId/edit"
                   element={<ProtectedRoute allowedRole="admin"><AdminVideoEdit/></ProtectedRoute>}/>
            <Route path="/admin/tasks" element={<ProtectedRoute allowedRole="admin"><AdminTasks/></ProtectedRoute>}/>
            <Route path="/admin/tasks/create" element={<ProtectedRoute allowedRole="admin"><AdminTaskCreate/></ProtectedRoute>}/>
            <Route path="/admin/tasks/:taskId" element={<ProtectedRoute allowedRole="admin"><AdminTaskDetail/></ProtectedRoute>}/>
            <Route path="/admin/tasks/:taskId/stats" element={<ProtectedRoute allowedRole="admin"><AdminTaskStatistics/></ProtectedRoute>}/>
            <Route path="/admin/notifications"
                   element={<ProtectedRoute allowedRole="admin"><AdminNotifications/></ProtectedRoute>}/>
            <Route path="/admin/submissions/:submissionId"
                   element={<ProtectedRoute allowedRole="admin"><AdminSubmissionDetail/></ProtectedRoute>}/>
            
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
                            <BrowserRouter>
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
