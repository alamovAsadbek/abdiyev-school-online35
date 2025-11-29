import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, Calendar, Save, X, CreditCard, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getUserPayments, formatCurrency, formatDate, getDaysUntilExpiry } from '@/data/demoData';
import { cn } from '@/lib/utils';

export default function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  // Parse name into first and last name
  const nameParts = user?.name.split(' ') || [];
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';
  
  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
  });

  // Get user payments
  const userPayments = user ? getUserPayments(user.id).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast.error('Ism kiritilishi shart');
      return;
    }
    
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    updateProfile({ name: fullName });
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
                      <User className="h-4 w-4 mr-2" />
                      Tahrirlash
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{user.role === 'admin' ? 'Administrator' : 'O\'quvchi'}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Editable Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Ism *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Familiyangizni kiriting"
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Read-only Fields */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Telefon</p>
                          <p className="font-medium">{user.phone}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Ro'yxatdan o'tgan sana</p>
                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <>
                      <Separator />
                      <div className="flex gap-3">
                        <Button type="submit" className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Saqlash
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                          <X className="h-4 w-4 mr-2" />
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
                <CardTitle>To'lovlar tarixi</CardTitle>
                <CardDescription>Barcha to'lovlaringiz ro'yxati</CardDescription>
              </CardHeader>
              <CardContent>
                {userPayments.length > 0 ? (
                  <div className="space-y-3">
                    {userPayments.map((payment) => {
                      const daysLeft = payment.status === 'active' ? getDaysUntilExpiry(payment.expiresAt) : 0;
                      
                      return (
                        <div
                          key={payment.id}
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            payment.status === 'active' 
                              ? "bg-success/5 border-success/30" 
                              : "bg-muted/50 border-border"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0",
                                payment.status === 'active' 
                                  ? "bg-success/20 text-success" 
                                  : "bg-muted text-muted-foreground"
                              )}>
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-foreground">
                                    {formatCurrency(payment.amount)}
                                  </p>
                                  <span className={cn(
                                    "status-badge text-xs",
                                    payment.status === 'active' 
                                      ? "status-completed" 
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {payment.status === 'active' ? 'Faol' : 'Tugagan'}
                                  </span>
                                </div>
                                
                                {payment.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {payment.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Qabul: {formatDate(payment.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Tugash: {formatDate(payment.expiresAt)}</span>
                                  </div>
                                </div>
                                
                                {payment.status === 'active' && daysLeft <= 30 && (
                                  <p className="text-xs text-warning mt-2 font-medium">
                                    ⚠️ {daysLeft} kun qoldi
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">To'lovlar tarixi mavjud emas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
