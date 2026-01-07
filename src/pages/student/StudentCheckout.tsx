import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {ShoppingCart, Trash2, CreditCard, ArrowLeft, Check, Shield, Clock} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Separator} from '@/components/ui/separator';
import {useToast} from '@/hooks/use-toast';
import {formatCurrency} from '@/data/demoData';
import {paymentsApi, userCoursesApi} from '@/services/api';

interface CartItem {
    id: string;
    name: string;
    icon: string;
    price: number;
    description: string;
}

export default function StudentCheckout() {
    const navigate = useNavigate();
    const {toast} = useToast();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('course_cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('course_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const removeFromCart = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
        toast({title: 'Olib tashlandi', description: 'Kurs savatdan olib tashlandi'});
    };

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            toast({title: 'Xatolik', description: 'Savat bo\'sh', variant: 'destructive'});
            return;
        }

        setIsProcessing(true);

        try {
            // Create payment record
            await paymentsApi.create({
                amount: totalPrice,
                description: `Kurslar: ${cartItems.map(c => c.name).join(', ')}`,
                status: 'pending',
            });

            // Clear cart
            setCartItems([]);
            localStorage.removeItem('course_cart');

            toast({
                title: 'Muvaffaqiyat!',
                description: 'To\'lov so\'rovi yuborildi. Admin tasdiqlashini kuting.',
            });

            navigate('/student/courses');
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'To\'lov amalga oshmadi',
                variant: 'destructive'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/student/courses')}
                    className="-ml-2 mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Kurslarga qaytish
                </Button>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                    <ShoppingCart className="inline-block mr-3 h-8 w-8"/>
                    To'lov sahifasi
                </h1>
                <p className="text-muted-foreground">
                    Tanlangan kurslaringizni sotib oling
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            Savatdagi kurslar ({cartItems.length})
                        </h2>

                        {cartItems.length === 0 ? (
                            <div className="text-center py-12">
                                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
                                <p className="text-muted-foreground mb-4">Savat bo'sh</p>
                                <Button onClick={() => navigate('/student/courses')}>
                                    Kurslarni ko'rish
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">{item.name}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-lg text-primary">
                                                {formatCurrency(item.price)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-destructive hover:bg-destructive"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Methods */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            To'lov usulini tanlang
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${
                                    paymentMethod === 'card'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                }`}
                            >
                                <CreditCard className="h-6 w-6 mb-2 text-primary"/>
                                <h3 className="font-semibold text-foreground">Plastik karta</h3>
                                <p className="text-sm text-muted-foreground">
                                    Visa, Mastercard, Uzcard, Humo
                                </p>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('transfer')}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${
                                    paymentMethod === 'transfer'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                }`}
                            >
                                <Shield className="h-6 w-6 mb-2 text-primary"/>
                                <h3 className="font-semibold text-foreground">Bank o'tkazmasi</h3>
                                <p className="text-sm text-muted-foreground">
                                    To'g'ridan-to'g'ri bank hisobiga
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            To'lov ma'lumotlari
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                                <h3 className="font-semibold text-warning mb-2 flex items-center gap-2">
                                    <Clock className="h-4 w-4"/>
                                    Muhim ma'lumot
                                </h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• To'lov so'rovi yuborilgandan so'ng admin tekshiradi</li>
                                    <li>• To'lov tasdiqlangandan keyin kurslarga kirish ochiladi</li>
                                    <li>• Odatda 1-24 soat ichida tasdiqlanadi</li>
                                    <li>• Savollar bo'lsa admin bilan bog'laning</li>
                                </ul>
                            </div>

                            {paymentMethod === 'transfer' && (
                                <div className="p-4 rounded-lg bg-muted border border-border">
                                    <h3 className="font-semibold text-foreground mb-2">Bank rekvizitlari:</h3>
                                    <div className="text-sm space-y-1 text-muted-foreground">
                                        <p><strong>Bank:</strong> Kapitalbank</p>
                                        <p><strong>Hisob raqami:</strong> 2020 0000 1234 5678</p>
                                        <p><strong>MFO:</strong> 01234</p>
                                        <p><strong>INN:</strong> 123456789</p>
                                        <p><strong>Oluvchi:</strong> Abdiyev Academy</p>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'card' && (
                                <div className="p-4 rounded-lg bg-muted border border-border">
                                    <h3 className="font-semibold text-foreground mb-2">Karta ma'lumotlari:</h3>
                                    <div className="text-sm space-y-1 text-muted-foreground">
                                        <p><strong>Karta raqami:</strong> 8600 1234 5678 9012</p>
                                        <p><strong>Karta egasi:</strong> ABDIYEV ACADEMY</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            Buyurtma xulosasi
                        </h2>

                        <div className="space-y-3 mb-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{item.name}</span>
                                    <span className="text-foreground">{formatCurrency(item.price)}</span>
                                </div>
                            ))}
                        </div>

                        <Separator className="my-4"/>

                        <div className="flex justify-between items-center mb-6">
                            <span className="text-lg font-semibold text-foreground">Jami:</span>
                            <span className="text-2xl font-bold text-primary">
                                {formatCurrency(totalPrice)}
                            </span>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={cartItems.length === 0 || isProcessing}
                            className="w-full gradient-primary text-primary-foreground h-12 text-lg"
                        >
                            {isProcessing ? (
                                'Jarayonda...'
                            ) : (
                                <>
                                    <Check className="mr-2 h-5 w-5"/>
                                    To'lovni tasdiqlash
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center mt-4">
                            "To'lovni tasdiqlash" tugmasini bosish orqali siz xizmat shartlariga rozilik bildirasiz
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}