import {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft, Mail, Phone, Calendar, Ban, CheckCircle2, Gift, Plus, Trash2, CalendarClock, Edit} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {formatDate, formatCurrency} from '@/data/demoData';
import {cn} from '@/lib/utils';
import {usersApi, paymentsApi, userCoursesApi, categoriesApi, notificationsApi} from "@/services/api";

interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    is_blocked: boolean;
    created_at: string;
    last_login: string;
}

interface Payment {
    id: string;
    user: string;
    amount: number;
    description: string;
    status: string;
    expires_at: string;
    created_at: string;
}

interface UserCourse {
    id: string;
    user: string;
    category: string;
    category_name: string;
    granted_at: string;
    granted_by: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
}

interface UserNotification {
    id: string;
    notification: Notification;
    is_read: boolean;
    received_at: string;
}

export default function AdminUserDetail() {
    const {userId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [courses, setCourses] = useState<UserCourse[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({amount: '', expiresAt: '', description: ''});
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);

    // Confirmation dialog states
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


    const fetchData = async () => {
        try {
            const [userRes, paymentsRes, coursesRes, categoriesRes, userNotifsRes] = await Promise.all([
                usersApi.getById(userId!),
                paymentsApi.getAll({user: userId}),
                userCoursesApi.getAll({user: userId}),
                categoriesApi.getAll(),
                notificationsApi.getUserNotifications(userId!),
            ]);
            setUser(userRes);
            setPayments(paymentsRes?.results || paymentsRes || []);
            setCourses(coursesRes?.results || coursesRes || []);
            setCategories(categoriesRes?.results || categoriesRes || []);
            setUserNotifications(userNotifsRes?.results || userNotifsRes || []);
        } catch (error) {
            console.log(error);
            toast({
                title: 'Xatolik',
                description: 'Ma\'lumotlarni yuklashda xatolik!',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [userId]);


    if (!user) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground mb-4">
                        {loading ? "Yuklanmoqda..." : "Foydalanuvchi topilmadi"}
                    </p>
                    {!loading && <Button onClick={() => navigate('/admin/users')}>Orqaga qaytish</Button>}
                </div>
            </DashboardLayout>
        );
    }

    const handleAddPayment = async () => {
        if (!paymentForm.amount || !paymentForm.expiresAt) {
            toast({title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring', variant: 'destructive'});
            return;
        }

        try {
            const newPayment = await paymentsApi.create({
                user: userId,
                amount: parseInt(paymentForm.amount),
                expires_at: paymentForm.expiresAt,
                description: paymentForm.description,
                status: 'active',
            });
            setPayments(prev => [newPayment, ...prev]);
            setIsPaymentDialogOpen(false);
            setPaymentForm({amount: '', expiresAt: '', description: ''});
            toast({title: 'Muvaffaqiyat', description: 'To\'lov qo\'shildi'});
        } catch (error) {
            toast({title: 'Xatolik', description: 'To\'lov qo\'shishda xatolik', variant: 'destructive'});
        }
    };

    const handleGiftCourse = async () => {
        if (!selectedCategoryId) {
            toast({title: 'Xatolik', description: 'Kursni tanlang', variant: 'destructive'});
            return;
        }

        const exists = courses.find(c => c.category === selectedCategoryId);
        if (exists) {
            toast({title: 'Xatolik', description: 'Bu kurs allaqachon mavjud', variant: 'destructive'});
            return;
        }

        try {
            const newCourse = await userCoursesApi.grantCourse(userId!, selectedCategoryId, 'gift');
            setCourses(prev => [newCourse, ...prev]);
            setIsCourseDialogOpen(false);
            setSelectedCategoryId('');
            toast({title: 'Muvaffaqiyat', description: 'Kurs sovg\'a qilindi'});
        } catch (error) {
            toast({title: 'Xatolik', description: 'Kurs qo\'shishda xatolik', variant: 'destructive'});
        }
    };

    const handleRemoveCourse = async () => {
        if (courseToDelete) {
            try {
                // TODO: Add delete endpoint for user courses
                setCourses(prev => prev.filter(c => c.id !== courseToDelete));
                setCourseToDelete(null);
                toast({title: 'O\'chirildi', description: 'Kurs olib tashlandi'});
            } catch (error) {
                toast({title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive'});
            }
        }
    };

    const handleRemovePayment = async () => {
        if (paymentToDelete) {
            try {
                await paymentsApi.delete(paymentToDelete);
                setPayments(prev => prev.filter(p => p.id !== paymentToDelete));
                setPaymentToDelete(null);
                toast({title: 'O\'chirildi', description: 'To\'lov olib tashlandi'});
            } catch (error) {
                toast({title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive'});
            }
        }
    };

    const handleBlockToggle = async () => {
        try {
            if (user.is_blocked) {
                await usersApi.unblock(userId!);
            } else {
                await usersApi.block(userId!);
            }
            setUser(prev => prev ? {...prev, is_blocked: !prev.is_blocked} : null);
            setShowBlockConfirm(false);
            toast({
                title: user.is_blocked ? 'Faollashtirildi' : 'Bloklandi',
                description: user.is_blocked ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi bloklandi'
            });
        } catch (error) {
            toast({title: 'Xatolik', description: 'Amalda xatolik', variant: 'destructive'});
        }
    };

    const getCategoryById = (id: string) => categories.find(c => c.id === id);

    const handleDeleteUser = async () => {
        try {
            await usersApi.delete(userId!);
            toast({ title: 'O\'chirildi', description: 'Foydalanuvchi o\'chirildi' });
            navigate('/admin/users');
        } catch (error) {
            toast({ title: 'Xatolik', description: 'Foydalanuvchini o\'chirishda xatolik', variant: 'destructive' });
        } finally {
            setShowDeleteConfirm(false);
        }
    };



    return (
        <DashboardLayout>
            {/* Back Button */}
            <Button variant="ghost" onClick={() => navigate('/admin/users')} className="mb-6 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Orqaga
            </Button>

            {/* User Info Card */}
            <div className="rounded-xl border border-border bg-card p-6 mb-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className={cn(
                        "flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold",
                        user.is_blocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    )}>
                        {user.first_name?.charAt(0) || user.username?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                {user.first_name || user.username || "Ism mavjud emas"} {user.last_name || ""}
                            </h1>
                            <span className={cn(
                                "status-badge",
                                user.is_blocked ? "bg-destructive/15 text-destructive" : "status-completed"
                            )}>
                                {user.is_blocked ? 'Bloklangan' : 'Faol'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-muted-foreground">
                            {user.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4"/>
                                    {user.email}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4"/>
                                {user.phone || "Mavjud emas"}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4"/>
                                {formatDate(user.created_at)}
                            </div>
                            <div className="flex items-center gap-2" title='Hisobga kirilgan sana'>
                                <CalendarClock className="h-4 w-4"/>
                                {formatDate(user.last_login) || ""}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/users/${userId}/edit`)}
                        >
                            <Edit className="mr-2 h-4 w-4"/>
                            Tahrirlash
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowBlockConfirm(true)}
                            className={user.is_blocked ? "text-success border-success hover:bg-success/10" : "text-warning border-warning hover:bg-warning/10"}
                        >
                            {user.is_blocked ? <CheckCircle2 className="mr-2 h-4 w-4"/> : <Ban className="mr-2 h-4 w-4"/>}
                            {user.is_blocked ? 'Faollashtirish' : 'Bloklash'}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            O'chirish
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="courses" className="animate-fade-in" style={{animationDelay: '0.1s'}}>
                <TabsList className="mb-6">
                    <TabsTrigger value="courses">Kurslar ({courses.length})</TabsTrigger>
                    <TabsTrigger value="payments">To'lovlar ({payments.length})</TabsTrigger>
                    <TabsTrigger value="notifications">Xabarnomalar ({userNotifications.length})</TabsTrigger>
                </TabsList>

                {/* Courses Tab */}
                <TabsContent value="courses">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setIsCourseDialogOpen(true)}
                                className="gradient-primary text-primary-foreground">
                            <Gift className="mr-2 h-4 w-4"/>
                            Kurs sovg'a qilish
                        </Button>
                    </div>
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-4 font-medium text-muted-foreground">Kurs</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Berilgan sana</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Turi</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Amallar</th>
                            </tr>
                            </thead>
                            <tbody>
                            {courses.length > 0 ? courses.map(course => {
                                const category = getCategoryById(course.category);
                                return (
                                    <tr key={course.id} className="border-b border-border last:border-0">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{category?.icon}</span>
                                                <span className="font-medium">{category?.name || course.category_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{formatDate(course.granted_at)}</td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "status-badge",
                                                course.granted_by === 'gift' ? "bg-accent/15 text-accent" : "status-completed"
                                            )}>
                                                {course.granted_by === 'gift' ? 'Sovg\'a' : 'To\'lov'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setCourseToDelete(course.id)}
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        Kurslar topilmadi
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setIsPaymentDialogOpen(true)}
                                className="gradient-primary text-primary-foreground">
                            <Plus className="mr-2 h-4 w-4"/>
                            To'lov qo'shish
                        </Button>
                    </div>
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-4 font-medium text-muted-foreground">Summa</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Tavsif</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Sana</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Amal qilish muddati</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Holat</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Amallar</th>
                            </tr>
                            </thead>
                            <tbody>
                            {payments.length > 0 ? payments.map(payment => (
                                <tr key={payment.id} className="border-b border-border last:border-0">
                                    <td className="p-4 font-semibold text-foreground">{formatCurrency(payment.amount)}</td>
                                    <td className="p-4 text-muted-foreground">{payment.description || '-'}</td>
                                    <td className="p-4 text-muted-foreground">{formatDate(payment.created_at)}</td>
                                    <td className="p-4 text-muted-foreground">{formatDate(payment.expires_at)}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "status-badge",
                                            payment.status === 'active' ? "status-completed" : "bg-destructive/15 text-destructive"
                                        )}>
                                            {payment.status === 'active' ? 'Faol' : 'Tugagan'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPaymentToDelete(payment.id)}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        To'lovlar topilmadi
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-4 font-medium text-muted-foreground">Sarlavha</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Turi</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Holat</th>
                                <th className="text-left p-4 font-medium text-muted-foreground">Sana</th>
                            </tr>
                            </thead>
                            <tbody>
                            {userNotifications.length > 0 ? userNotifications.map((un) => (
                                <tr key={un.id} className="border-b border-border last:border-0">
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-foreground">{un.notification?.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{un.notification?.message}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="status-badge bg-primary/10 text-primary">
                                            {un.notification?.type || 'system'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "status-badge",
                                            un.is_read ? "status-completed" : "bg-warning/15 text-warning"
                                        )}>
                                            {un.is_read ? "O'qilgan" : "Yangi"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{formatDate(un.received_at)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        Xabarnomalar topilmadi
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>


            {/* Gift Course Dialog */}
            <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kurs sovg'a qilish</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Kursni tanlang</Label>
                            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Kurs tanlang"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)}>Bekor qilish</Button>
                            <Button onClick={handleGiftCourse} className="gradient-primary text-primary-foreground">
                                <Gift className="mr-2 h-4 w-4"/>
                                Sovg'a qilish
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>To'lov qo'shish</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Summa (so'm)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="500000"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm(prev => ({...prev, amount: e.target.value}))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiresAt">Amal qilish muddati</Label>
                            <Input
                                id="expiresAt"
                                type="date"
                                value={paymentForm.expiresAt}
                                onChange={(e) => setPaymentForm(prev => ({...prev, expiresAt: e.target.value}))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Tavsif</Label>
                            <Input
                                id="description"
                                placeholder="1 oylik obuna"
                                value={paymentForm.description}
                                onChange={(e) => setPaymentForm(prev => ({...prev, description: e.target.value}))}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Bekor qilish</Button>
                            <Button onClick={handleAddPayment} className="gradient-primary text-primary-foreground">Saqlash</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Course Confirmation */}
            <ConfirmDialog
                open={!!courseToDelete}
                onOpenChange={(open) => !open && setCourseToDelete(null)}
                title="Kursni o'chirish"
                description="Rostdan ham bu kursni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleRemoveCourse}
            />

            {/* Delete Payment Confirmation */}
            <ConfirmDialog
                open={!!paymentToDelete}
                onOpenChange={(open) => !open && setPaymentToDelete(null)}
                title="To'lovni o'chirish"
                description="Rostdan ham bu to'lovni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleRemovePayment}
            />

            {/* Block/Unblock Confirmation */}
            <ConfirmDialog
                open={showBlockConfirm}
                onOpenChange={setShowBlockConfirm}
                title={user.is_blocked ? "Foydalanuvchini faollashtirish" : "Foydalanuvchini bloklash"}
                description={user.is_blocked
                    ? "Rostdan ham bu foydalanuvchini faollashtirishni xohlaysizmi? U yana tizimdan foydalana oladi."
                    : "Rostdan ham bu foydalanuvchini bloklashni xohlaysizmi? U tizimdan foydalana olmaydi."}
                confirmText={user.is_blocked ? "Ha, faollashtirish" : "Ha, bloklash"}
                cancelText="Bekor qilish"
                variant={user.is_blocked ? "default" : "destructive"}
                onConfirm={handleBlockToggle}
            />

            {/* Delete User Confirmation */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Foydalanuvchini o'chirish"
                description="Rostdan ham bu foydalanuvchini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleDeleteUser}
            />
        </DashboardLayout>
    );
}
