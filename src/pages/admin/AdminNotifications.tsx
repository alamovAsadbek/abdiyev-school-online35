import {useState, useEffect} from 'react';
import {Plus, Trash2, Eye, Calendar, Send, Clock} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {DataTable, Column, Filter} from '@/components/DataTable';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {useToast} from '@/hooks/use-toast';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {notificationsApi, usersApi} from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {Badge} from '@/components/ui/badge';
import {Switch} from '@/components/ui/switch';
import {formatDate} from "@/lib/utils";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    sent_count: number;
    status: string;
    scheduled_at: string | null;
    created_at: string;
}

interface User {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [notifToDelete, setNotifToDelete] = useState<string | null>(null);
    const [viewNotif, setViewNotif] = useState<Notification | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'system',
        recipient: 'all',
        selectedUsers: [] as string[],
        sendNow: true,
        scheduledDate: '',
        scheduledTime: '',
    });
    const {toast} = useToast();

    useEffect(() => {
        fetchNotifications();
        fetchUsers();
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

    const fetchUsers = async () => {
        try {
            const response = await usersApi.getAll({role: 'student'});
            const data = response?.results || response || [];
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleSendNotification = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            toast({
                title: 'Xatolik',
                description: 'Sarlavha va xabar kiritilishi shart',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.sendNow && (!formData.scheduledDate || !formData.scheduledTime)) {
            toast({
                title: 'Xatolik',
                description: 'Rejalashtirilgan vaqtni tanlang',
                variant: 'destructive',
            });
            return;
        }

        setSending(true);
        try {
            const payload: any = {
                title: formData.title,
                message: formData.message,
                type: formData.type,
                send_now: formData.sendNow,
            };

            if (formData.recipient === 'all') {
                payload.send_to_all = true;
            } else {
                payload.user_ids = [formData.recipient];
            }

            if (!formData.sendNow) {
                const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
                payload.scheduled_at = scheduledDateTime.toISOString();
            }

            await notificationsApi.send(payload);

            toast({
                title: 'Muvaffaqiyat',
                description: formData.sendNow
                    ? (formData.recipient === 'all'
                        ? `Xabarnoma barcha o'quvchilarga yuborildi`
                        : 'Xabarnoma yuborildi')
                    : 'Xabarnoma rejalashtirildi',
            });

            setIsCreateOpen(false);
            setFormData({
                title: '',
                message: '',
                type: 'system',
                recipient: 'all',
                selectedUsers: [],
                sendNow: true,
                scheduledDate: '',
                scheduledTime: '',
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to send notification:', error);
            toast({
                title: 'Xatolik',
                description: 'Xabarnomani yuborishda xatolik',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
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
                    onClick={() => setIsCreateOpen(true)}
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

            {/* Create Notification Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Yangi xabarnoma yuborish</DialogTitle>
                        <DialogDescription>
                            O'quvchilarga xabarnoma yuboring
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Qabul qiluvchi</Label>
                            <Select
                                value={formData.recipient}
                                onValueChange={(value) => setFormData(prev => ({...prev, recipient: value}))}
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Barcha o'quvchilar ({users.length} ta)</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.first_name} {user.last_name} (@{user.username})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Turi</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="system">Tizim xabari</SelectItem>
                                    <SelectItem value="course">Kurs haqida</SelectItem>
                                    <SelectItem value="payment">To'lov haqida</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notif-title">Sarlavha</Label>
                            <Input
                                id="notif-title"
                                placeholder="Xabar sarlavhasi"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notif-message">Xabar matni</Label>
                            <Textarea
                                id="notif-message"
                                placeholder="Xabar matnini kiriting..."
                                rows={4}
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
                            />
                        </div>

                        {/* Send Now Toggle */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div className="space-y-0.5">
                                <Label htmlFor="send-now" className="font-medium">Hozir yuborish</Label>
                                <p className="text-xs text-muted-foreground">
                                    {formData.sendNow ? 'Xabarnoma darhol yuboriladi' : 'Belgilangan vaqtda yuboriladi'}
                                </p>
                            </div>
                            <Switch
                                id="send-now"
                                checked={formData.sendNow}
                                onCheckedChange={(checked) => setFormData(prev => ({...prev, sendNow: checked}))}
                            />
                        </div>

                        {/* Scheduled Date/Time */}
                        {!formData.sendNow && (
                            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduled-date">Sana</Label>
                                    <Input
                                        id="scheduled-date"
                                        type="date"
                                        min={minDate}
                                        value={formData.scheduledDate}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            scheduledDate: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="scheduled-time">Vaqt</Label>
                                    <Input
                                        id="scheduled-time"
                                        type="time"
                                        min={formData.scheduledDate === minDate ? minTime : undefined}
                                        value={formData.scheduledTime}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            scheduledTime: e.target.value
                                        }))}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Bekor qilish
                            </Button>
                            <Button
                                onClick={handleSendNotification}
                                className="gradient-primary text-primary-foreground"
                                disabled={sending}
                            >
                                {formData.sendNow ? (
                                    <>
                                        <Send className="h-4 w-4 mr-2"/>
                                        {sending ? 'Yuborilmoqda...' : 'Yuborish'}
                                    </>
                                ) : (
                                    <>
                                        <Clock className="h-4 w-4 mr-2"/>
                                        {sending ? 'Saqlanmoqda...' : 'Rejalashtirish'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                                <label className="text-sm font-medium text-muted-foreground">Rejalashtirilgan
                                    vaqt</label>
                                <p className="mt-1 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                    {formatDate(viewNotif.scheduled_at)}
                                </p>
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
