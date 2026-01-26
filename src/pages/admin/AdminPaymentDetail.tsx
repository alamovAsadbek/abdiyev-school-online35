import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft, User, Calendar, CreditCard, Clock} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {demoPayments, getUserById, formatCurrency, getDaysUntilExpiry} from '@/data/demoData';
import {cn, formatDate} from '@/lib/utils';
import {useEffect, useState} from "react";
import {toast} from "@/hooks/use-toast.ts";
import api from "@/services/api.ts";

export default function AdminPaymentDetail() {
    const {paymentId} = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState();
    const [user, setUser] = useState();

    // get payment data
    const getPayment = async () => {
        try {
            api.get(`/payments/${paymentId}/`).then((response) => {
                console.log(response)
                setPayment(response)
                setUser(response.user)
            }).catch((error) => {
                console.log(error);
                toast({
                    title: 'Xatolik!',
                    description: error.message,
                })
            })
        } catch (e) {
            console.log(e)
            toast({
                title: 'Xatolik!',
                description: e.message,
            })
        }
    }

    useEffect(() => {
        getPayment()
    }, [paymentId]);

    if (!payment) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground mb-4">To'lov topilmadi</p>
                    <Button onClick={() => navigate('/admin/payments')}>
                        Orqaga qaytish
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const daysLeft = getDaysUntilExpiry(payment.expires_at);

    return (
        <DashboardLayout>
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/admin/payments')}
                className="mb-6 -ml-2"
            >
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Orqaga
            </Button>

            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                    To'lov tafsilotlari
                </h1>
                <p className="text-muted-foreground">
                    To'lov haqida batafsil ma'lumot
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Payment Status Card */}
                    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-foreground">To'lov holati</h2>
                            <span className={cn(
                                "status-badge",
                                payment.status === 'active' ? "status-completed" : "bg-destructive/15 text-destructive"
                            )}>
                {payment.status === 'active' ? 'Faol' : 'Tugagan'}
              </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <CreditCard className="h-5 w-5"/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Summa</p>
                                        <p className="text-lg font-bold text-foreground">{formatCurrency(payment.amount)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                        <Calendar className="h-5 w-5"/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">To'lov sanasi</p>
                                        <p className="text-sm font-medium text-foreground">{formatDate(payment.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                                        <Clock className="h-5 w-5"/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Amal qilish muddati</p>
                                        <p className="text-sm font-medium text-foreground">{formatDate(payment.expires_at)}</p>
                                        {payment.status === 'active' && daysLeft <= 7 && (
                                            <p className="text-xs text-warning mt-1">{daysLeft} kun qoldi</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {payment.description && (
                            <div className="mt-6 pt-6 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-1">Tavsif</p>
                                <p className="text-sm text-foreground">{payment.description}</p>
                            </div>
                        )}
                    </div>


                    {/*user info*/}

                    <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6 animate-fade-in"
                             style={{animationDelay: '0.2s'}}>
                            <h2 className="text-lg font-semibold text-foreground mb-4">O'quvchi ma'lumotlari</h2>

                            {user ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                                            {user.first_name.charAt(0)}
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                                className="text-sm font-medium text-foreground hover:text-primary transition-colors underline"
                                            >
                                                {user.last_name} {user.first_name}
                                            </button>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Telefon</p>
                                            <p className="text-sm text-foreground">{user.phone || 'Kiritilmagan'}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Ro'yxatdan o'tgan</p>
                                            <p className="text-sm text-foreground">{formatDate(user.created_at)}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Holat</p>
                                            <span className={cn(
                                                "status-badge",
                                                user.is_blocked ? "bg-destructive/15 text-destructive" : "status-completed"
                                            )}>
                      {user.is_blocked ? 'Bloklangan' : 'Faol'}
                    </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full mt-4"
                                        onClick={() => navigate(`/admin/users/${user.id}`)}
                                    >
                                        <User className="mr-2 h-4 w-4"/>
                                        Batafsil ko'rish
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Foydalanuvchi topilmadi</p>
                            )}
                        </div>
                    </div>


                    {/* Payment ID */}
                    {/*<div className="rounded-xl border border-border bg-card p-6 animate-fade-in"*/}
                    {/*     style={{animationDelay: '0.1s'}}>*/}
                    {/*    <h2 className="text-lg font-semibold text-foreground mb-4">To'lov identifikatori</h2>*/}
                    {/*    <div className="p-3 rounded-lg bg-muted font-mono text-sm">*/}
                    {/*        {payment.id}*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

                {/* User Info Sidebar */}
                {/*<div className="space-y-6">*/}
                {/*    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in"*/}
                {/*         style={{animationDelay: '0.2s'}}>*/}
                {/*        <h2 className="text-lg font-semibold text-foreground mb-4">O'quvchi ma'lumotlari</h2>*/}

                {/*        {user ? (*/}
                {/*            <div className="space-y-4">*/}
                {/*                <div className="flex items-center gap-3 pb-4 border-b border-border">*/}
                {/*                    <div*/}
                {/*                        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">*/}
                {/*                        {user.name.charAt(0)}*/}
                {/*                    </div>*/}
                {/*                    <div>*/}
                {/*                        <button*/}
                {/*                            onClick={() => navigate(`/admin/users/${user.id}`)}*/}
                {/*                            className="text-sm font-medium text-foreground hover:text-primary transition-colors underline"*/}
                {/*                        >*/}
                {/*                            {user.name}*/}
                {/*                        </button>*/}
                {/*                        <p className="text-xs text-muted-foreground">{user.email}</p>*/}
                {/*                    </div>*/}
                {/*                </div>*/}

                {/*                <div className="space-y-3">*/}
                {/*                    <div>*/}
                {/*                        <p className="text-xs text-muted-foreground mb-1">Telefon</p>*/}
                {/*                        <p className="text-sm text-foreground">{user.phone || 'Kiritilmagan'}</p>*/}
                {/*                    </div>*/}

                {/*                    <div>*/}
                {/*                        <p className="text-xs text-muted-foreground mb-1">Ro'yxatdan o'tgan</p>*/}
                {/*                        <p className="text-sm text-foreground">{formatDate(user.createdAt)}</p>*/}
                {/*                    </div>*/}

                {/*                    <div>*/}
                {/*                        <p className="text-xs text-muted-foreground mb-1">Holat</p>*/}
                {/*                        <span className={cn(*/}
                {/*                            "status-badge",*/}
                {/*                            user.isBlocked ? "bg-destructive/15 text-destructive" : "status-completed"*/}
                {/*                        )}>*/}
                {/*      {user.isBlocked ? 'Bloklangan' : 'Faol'}*/}
                {/*    </span>*/}
                {/*                    </div>*/}
                {/*                </div>*/}

                {/*                <Button*/}
                {/*                    variant="outline"*/}
                {/*                    className="w-full mt-4"*/}
                {/*                    onClick={() => navigate(`/admin/users/${user.id}`)}*/}
                {/*                >*/}
                {/*                    <User className="mr-2 h-4 w-4"/>*/}
                {/*                    Batafsil ko'rish*/}
                {/*                </Button>*/}
                {/*            </div>*/}
                {/*        ) : (*/}
                {/*            <p className="text-sm text-muted-foreground">Foydalanuvchi topilmadi</p>*/}
                {/*        )}*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </DashboardLayout>
    );
}
