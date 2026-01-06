import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {useAuth} from '@/contexts/AuthContext';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {User, Mail, Phone, Calendar, Save, X, CreditCard, Clock, Key} from 'lucide-react';
import {toast} from 'sonner';
import {getUserPayments, formatCurrency, getDaysUntilExpiry, Payment} from '@/data/demoData';
import {cn, formatDate} from '@/lib/utils';
import {DataTable, Column} from '@/components/DataTable';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

export default function StudentProfile() {
    const {user, updateProfile} = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [dateFilter, setDateFilter] = useState<string>('all');

    // Parse name into first and last name
    const nameParts = user?.name.split(' ') || [];
    const initialFirstName = nameParts[0] || '';
    const initialLastName = nameParts.slice(1).join(' ') || '';

    useEffect(() => {
        console.log(user)
    }, [user]);

    const [formData, setFormData] = useState({
        firstName: initialFirstName,
        lastName: initialLastName,
    });

    // Get user payments
    const allPayments = user ? getUserPayments(user.id).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) : [];

    // Filter payments by date
    const userPayments = allPayments.filter(payment => {
        if (dateFilter === 'all') return true;
        const paymentDate = new Date(payment.createdAt);
        const now = new Date();

        if (dateFilter === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return paymentDate >= sevenDaysAgo;
        } else if (dateFilter === '30days') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return paymentDate >= thirtyDaysAgo;
        } else if (dateFilter === '90days') {
            const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            return paymentDate >= ninetyDaysAgo;
        }
        return true;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName.trim()) {
            toast.error('Ism kiritilishi shart');
            return;
        }

        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
        updateProfile({name: fullName});
        setIsEditing(false);
        toast.success('Ma\'lumotlar muvaffaqiyatli yangilandi');
    };

    const handleCancel = () => {
        setFormData({
            firstName: initialFirstName,
            lastName: initialLastName,
        });
        setIsEditing(false);
    };

    const paymentColumns: Column<Payment>[] = [
        {
            key: 'amount',
            header: 'Summa',
            sortable: true,
            render: (payment) => (
                <span className="font-semibold text-foreground">
          {formatCurrency(payment.amount)}
        </span>
            ),
        },
        {
            key: 'description',
            header: 'Tavsif',
            render: (payment) => payment.description || '—',
        },
        {
            key: 'status',
            header: 'Holat',
            render: (payment) => {
                const daysLeft = payment.status === 'active' ? getDaysUntilExpiry(payment.expiresAt) : 0;
                return (
                    <div>
            <span className={cn(
                "status-badge text-xs",
                payment.status === 'active'
                    ? "status-completed"
                    : "bg-muted text-muted-foreground"
            )}>
              {payment.status === 'active' ? 'Faol' : 'Tugagan'}
            </span>
                        {payment.status === 'active' && daysLeft <= 30 && (
                            <p className="text-xs text-warning mt-1">
                                ⚠️ {daysLeft} kun qoldi
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'createdAt',
            header: 'Qabul qilingan',
            sortable: true,
            render: (payment) => (
                <div className="text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3"/>
                        {formatDate(payment.createdAt)}
                    </div>
                </div>
            ),
        },
        {
            key: 'expiresAt',
            header: 'Tugash sanasi',
            sortable: true,
            render: (payment) => (
                <div className="text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3"/>
                        {formatDate(payment.expiresAt)}
                    </div>
                </div>
            ),
        },
    ];

    if (!user) {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Profil</h1>
                    <p className="text-muted-foreground mt-1">Shaxsiy ma'lumotlaringizni ko'ring va tahrirlang</p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="info">Ma'lumotlar</TabsTrigger>
                        <TabsTrigger value="payments">To'lovlar</TabsTrigger>
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="info" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                                        <CardDescription>O'quvchi profil ma'lumotlari</CardDescription>
                                    </div>
                                    {!isEditing && (
                                        <Button onClick={() => setIsEditing(true)}>
                                            <User className="h-4 w-4 mr-2"/>
                                            Tahrirlash
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Avatar Section */}
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-semibold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{user.name}</h3>
                                            <p className="text-sm text-muted-foreground capitalize">{user.role === 'admin' ? 'Administrator' : 'O\'quvchi'}</p>
                                        </div>
                                    </div>

                                    <Separator/>

                                    {/* Editable Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">Ism *</Label>
                                            <Input
                                                id="firstName"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                                disabled={!isEditing}
                                                placeholder="Ismingizni kiriting"
                                                className={!isEditing ? 'bg-muted' : ''}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Familiya</Label>
                                            <Input
                                                id="lastName"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                                disabled={!isEditing}
                                                placeholder="Familiyangizni kiriting"
                                                className={!isEditing ? 'bg-muted' : ''}
                                            />
                                        </div>
                                    </div>

                                    <Separator/>

                                    {/* Read-only Fields */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Key className="h-5 w-5 text-muted-foreground"/>
                                            <div>
                                                <p className="text-muted-foreground">USER ID</p>
                                                <p className="font-medium">{user.watermark_id}</p>
                                            </div>
                                        </div>

                                        {user.phone && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Phone className="h-5 w-5 text-muted-foreground"/>
                                                <div>
                                                    <p className="text-muted-foreground">Telefon</p>
                                                    <p className="font-medium">{user.phone}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar className="h-5 w-5 text-muted-foreground"/>
                                            <div>
                                                <p className="text-muted-foreground">Ro'yxatdan o'tgan sana</p>
                                                <p className="font-medium">{formatDate(user.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {isEditing && (
                                        <>
                                            <Separator/>
                                            <div className="flex gap-3">
                                                <Button type="submit" className="flex-1">
                                                    <Save className="h-4 w-4 mr-2"/>
                                                    Saqlash
                                                </Button>
                                                <Button type="button" variant="outline" onClick={handleCancel}
                                                        className="flex-1">
                                                    <X className="h-4 w-4 mr-2"/>
                                                    Bekor qilish
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payments Tab */}
                    <TabsContent value="payments" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <CardTitle>To'lovlar tarixi</CardTitle>
                                        <CardDescription>Barcha to'lovlaringiz ro'yxati</CardDescription>
                                    </div>
                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Sana bo'yicha filter"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Barchasi</SelectItem>
                                            <SelectItem value="7days">So'nggi 7 kun</SelectItem>
                                            <SelectItem value="30days">So'nggi 30 kun</SelectItem>
                                            <SelectItem value="90days">So'nggi 90 kun</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    data={userPayments}
                                    columns={paymentColumns}
                                    searchPlaceholder="To'lovlarni qidirish..."
                                    searchKeys={['description']}
                                    emptyMessage="To'lovlar topilmadi"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
