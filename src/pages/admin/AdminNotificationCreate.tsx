import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Clock } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { notificationsApi, usersApi } from '@/services/api';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
}

export default function AdminNotificationCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedUserId = searchParams.get('user_id');
    const { toast } = useToast();
    
    const [users, setUsers] = useState<User[]>([]);
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'system',
        sendToAll: !preselectedUserId,
        selectedUserIds: preselectedUserId ? [preselectedUserId] : [] as string[],
        sendNow: true,
        scheduledDate: '',
        scheduledTime: '',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await usersApi.getAll({ role: 'student' });
            const data = response?.results || response || [];
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleUserToggle = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedUserIds: prev.selectedUserIds.includes(userId)
                ? prev.selectedUserIds.filter(id => id !== userId)
                : [...prev.selectedUserIds, userId]
        }));
    };

    const handleSend = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            toast({
                title: 'Xatolik',
                description: 'Sarlavha va xabar kiritilishi shart',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.sendToAll && formData.selectedUserIds.length === 0) {
            toast({
                title: 'Xatolik',
                description: "Kamida bitta qabul qiluvchini tanlang",
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

            if (formData.sendToAll) {
                payload.send_to_all = true;
            } else {
                payload.user_ids = formData.selectedUserIds;
            }

            if (!formData.sendNow) {
                const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
                payload.scheduled_at = scheduledDateTime.toISOString();
            }

            await notificationsApi.send(payload);

            toast({
                title: 'Muvaffaqiyat',
                description: formData.sendNow
                    ? 'Xabarnoma yuborildi'
                    : 'Xabarnoma rejalashtirildi',
            });

            navigate('/admin/notifications');
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

    const now = new Date();
    const minDate = now.toISOString().split('T')[0];

    const preselectedUser = preselectedUserId ? users.find(u => String(u.id) === preselectedUserId) : null;

    return (
        <DashboardLayout>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Orqaga
            </Button>

            <div className="max-w-2xl mx-auto">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        {preselectedUser 
                            ? `${preselectedUser.first_name || preselectedUser.username} ga xabar yuborish`
                            : 'Yangi xabarnoma yuborish'
                        }
                    </h1>
                    <p className="text-muted-foreground">
                        O'quvchilarga xabarnoma yuboring yoki rejalashtiring
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {/* Recipients */}
                    {!preselectedUserId && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Qabul qiluvchilar</Label>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="send-to-all" className="text-sm">Barchaga</Label>
                                    <Switch
                                        id="send-to-all"
                                        checked={formData.sendToAll}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendToAll: checked }))}
                                    />
                                </div>
                            </div>
                            
                            {!formData.sendToAll && (
                                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                                    {users.map(user => (
                                        <label 
                                            key={user.id} 
                                            className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={formData.selectedUserIds.includes(String(user.id))}
                                                onCheckedChange={() => handleUserToggle(String(user.id))}
                                            />
                                            <span className="text-sm">
                                                {user.first_name} {user.last_name} (@{user.username})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {preselectedUserId && preselectedUser && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <Label className="text-sm text-muted-foreground">Qabul qiluvchi</Label>
                            <p className="font-medium">{preselectedUser.first_name} {preselectedUser.last_name} (@{preselectedUser.username})</p>
                        </div>
                    )}

                    {/* Type */}
                    <div className="space-y-2">
                        <Label>Turi</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="system">Tizim xabari</SelectItem>
                                <SelectItem value="course">Kurs haqida</SelectItem>
                                <SelectItem value="payment">To'lov haqida</SelectItem>
                                <SelectItem value="info">Ma'lumot</SelectItem>
                                <SelectItem value="warning">Ogohlantirish</SelectItem>
                                <SelectItem value="success">Muvaffaqiyat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label>Sarlavha</Label>
                        <Input
                            placeholder="Xabar sarlavhasi"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label>Xabar matni</Label>
                        <Textarea
                            placeholder="Xabar matnini kiriting..."
                            rows={5}
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
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
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendNow: checked }))}
                        />
                    </div>

                    {/* Scheduled Date/Time */}
                    {!formData.sendNow && (
                        <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <Label>Sana</Label>
                                <Input
                                    type="date"
                                    min={minDate}
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Vaqt</Label>
                                <Input
                                    type="time"
                                    value={formData.scheduledTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            Bekor qilish
                        </Button>
                        <Button
                            onClick={handleSend}
                            className="gradient-primary text-primary-foreground"
                            disabled={sending}
                        >
                            {formData.sendNow ? (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    {sending ? 'Yuborilmoqda...' : 'Yuborish'}
                                </>
                            ) : (
                                <>
                                    <Clock className="h-4 w-4 mr-2" />
                                    {sending ? 'Saqlanmoqda...' : 'Rejalashtirish'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
