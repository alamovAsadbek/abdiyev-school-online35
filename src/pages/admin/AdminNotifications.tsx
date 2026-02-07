import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Plus, Trash2, Eye, Calendar, Clock, Users} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {DataTable, Column, Filter} from '@/components/DataTable';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {notificationsApi} from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {Badge} from '@/components/ui/badge';
import {formatDate} from "@/lib/utils";

interface NotificationRecipient {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    sent_count: number;
    recipients_count: number;
    recipients_detail?: NotificationRecipient[];
    status: string;
    scheduled_at: string | null;
    created_at: string;
}



export default function AdminNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [notifToDelete, setNotifToDelete] = useState<string | null>(null);
    const [viewNotif, setViewNotif] = useState<Notification | null>(null);
    const {toast} = useToast();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationsApi.getAll();
            const data = response?.results || response || [];
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast({
                title: 'Xatolik',
                description: 'Xabarnomalarni yuklashda xatolik',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };



    const handleDelete = async () => {
        if (notifToDelete) {
            try {
                await notificationsApi.delete(notifToDelete);
                setNotifications(prev => prev.filter(n => n.id !== notifToDelete));
                toast({title: 'O\'chirildi', description: 'Xabarnoma o\'chirildi'});
            } catch (error) {
                toast({
                    title: 'Xatolik',
                    description: 'O\'chirishda xatolik',
                    variant: 'destructive',
                });
            } finally {
                setNotifToDelete(null);
            }
        }
    };


    const getTypeLabel = (type: string) => {
        const labels: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' }> = {
            payment: {text: 'To\'lov', variant: 'default'},
            course: {text: 'Kurs', variant: 'secondary'},
            system: {text: 'Tizim', variant: 'outline'},
        };
        return labels[type] || {text: type, variant: 'default' as const};
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
            sent: {text: 'Yuborilgan', variant: 'default'},
            scheduled: {text: 'Rejalashtirilgan', variant: 'secondary'},
            pending: {text: 'Kutilmoqda', variant: 'outline'},
        };
        return labels[status] || {text: status, variant: 'outline' as const};
    };

    const columns: Column<Notification>[] = [
        {
            key: 'title',
            header: 'Sarlavha',
            render: (notif) => (
                <div>
                    <p className="font-medium text-card-foreground">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Turi',
            render: (notif) => {
                const {text, variant} = getTypeLabel(notif.type);
                return <Badge variant={variant}>{text}</Badge>;
            },
        },
        {
            key: 'status',
            header: 'Holati',
            render: (notif) => {
                const {text, variant} = getStatusLabel(notif.status || 'sent');
                return (
                    <div className="flex flex-col gap-1">
                        <Badge variant={variant}>{text}</Badge>
                        {notif.scheduled_at && notif.status === 'scheduled' && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3"/>
                                {formatDate(notif.scheduled_at)}
              </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'sent_count',
            header: 'Yuborildi',
            sortable: true,
            render: (notif) => (
                <span className="text-sm font-medium">{notif.sent_count} ta</span>
            ),
        },
        {
            key: 'created_at',
            header: 'Sana',
            sortable: true,
            render: (notif) => (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4"/>
                    {formatDate(notif.created_at)}
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Amallar',
            render: (notif) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewNotif(notif);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        <Eye className="h-4 w-4"/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setNotifToDelete(notif.id);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive"
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            ),
        },
    ];

    const filters: Filter[] = [
        {
            key: 'type',
            label: 'Turi',
            options: [
                {value: 'payment', label: 'To\'lov'},
                {value: 'course', label: 'Kurs'},
                {value: 'system', label: 'Tizim'},
            ],
        },
        {
            key: 'status',
            label: 'Holati',
            options: [
                {value: 'sent', label: 'Yuborilgan'},
                {value: 'scheduled', label: 'Rejalashtirilgan'},
            ],
        },
    ];

    // Get minimum date/time (now)
    const now = new Date();
    const minDate = now.toISOString().split('T')[0];
    const minTime = now.toTimeString().slice(0, 5);

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="animate-fade-in">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Xabarnomalar
                    </h1>
                    <p className="text-muted-foreground">
                        Yuborilgan xabarnomalarni boshqaring
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/admin/notifications/create')}
                    className="gradient-primary text-primary-foreground"
                >
                    <Plus className="mr-2 h-4 w-4"/>
                    Yangi xabarnoma
                </Button>
            </div>

            {/* Data Table */}
            <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
                <DataTable
                    data={notifications}
                    columns={columns}
                    filters={filters}
                    searchPlaceholder="Xabarnoma nomi bo'yicha qidirish..."
                    searchKeys={['title', 'message']}
                    onRowClick={(notif) => setViewNotif(notif)}
                    emptyMessage={loading ? "Yuklanmoqda..." : "Xabarnomalar topilmadi"}
                />
            </div>

            {/* View Dialog */}
            <Dialog open={!!viewNotif} onOpenChange={(open) => !open && setViewNotif(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewNotif?.title}</DialogTitle>
                        <DialogDescription>
                            {viewNotif?.created_at && formatDate(viewNotif.created_at)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Xabar</label>
                            <p className="mt-1 text-foreground">{viewNotif?.message}</p>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Turi</label>
                                <p className="mt-1">
                                    <Badge variant={getTypeLabel(viewNotif?.type || '').variant}>
                                        {getTypeLabel(viewNotif?.type || '').text}
                                    </Badge>
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Holati</label>
                                <p className="mt-1">
                                    <Badge variant={getStatusLabel(viewNotif?.status || 'sent').variant}>
                                        {getStatusLabel(viewNotif?.status || 'sent').text}
                                    </Badge>
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Yuborildi</label>
                                <p className="mt-1 font-medium">{viewNotif?.sent_count} ta foydalanuvchiga</p>
                            </div>
                        </div>
                        {viewNotif?.scheduled_at && viewNotif?.status === 'scheduled' && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Rejalashtirilgan vaqt</label>
                                <p className="mt-1 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                    {formatDate(viewNotif.scheduled_at)}
                                </p>
                            </div>
                        )}
                        {/* Recipients list */}
                        {viewNotif?.recipients_detail && viewNotif.recipients_detail.length > 0 && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4" />
                                    Qabul qiluvchilar ({viewNotif.recipients_detail.length} ta)
                                </label>
                                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y divide-border">
                                    {viewNotif.recipients_detail.map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer"
                                            onClick={() => {
                                                setViewNotif(null);
                                                navigate(`/admin/users/${r.id}`);
                                            }}
                                        >
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                {r.first_name?.charAt(0) || r.username?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm">
                                                {r.first_name} {r.last_name} <span className="text-muted-foreground">@{r.username}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!notifToDelete}
                onOpenChange={(open) => !open && setNotifToDelete(null)}
                title="Xabarnomani o'chirish"
                description="Rostdan ham bu xabarnomani o'chirmoqchimisiz?"
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </DashboardLayout>
    );
}
