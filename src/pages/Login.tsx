import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, User} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import bgImg from '@/data/images/loginBackground.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Signup fields
    const [signupUsername, setSignupUsername] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    
    const {login} = useAuth();
    const navigate = useNavigate();
    const {toast} = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const success = await login(email, password);

        if (success) {
            const user = JSON.parse(localStorage.getItem('abdiyev_user') || '{}');
            toast({
                title: 'Xush kelibsiz!',
                description: `${user.name}, tizimga muvaffaqiyatli kirdingiz.`,
            });
            navigate(user.role === 'admin' ? '/admin' : '/student');
        } else {
            toast({
                title: 'Xatolik',
                description: 'Email yoki parol noto\'g\'ri.',
                variant: 'destructive',
            });
        }

        setIsLoading(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (signupPassword !== signupConfirmPassword) {
            toast({
                title: 'Xatolik',
                description: 'Parollar mos kelmadi',
                variant: 'destructive',
            });
            return;
        }

        if (signupPassword.length < 6) {
            toast({
                title: 'Xatolik',
                description: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        // Simulate signup
        const newUser = {
            id: `user-${Date.now()}`,
            email: `${signupUsername}@abdiyev.uz`,
            password: signupPassword,
            name: signupUsername,
            role: 'student' as const,
            createdAt: new Date().toISOString().split('T')[0],
            isBlocked: false,
        };

        localStorage.setItem('abdiyev_user', JSON.stringify(newUser));
        
        toast({
            title: 'Muvaffaqiyat!',
            description: 'Ro\'yxatdan o\'tdingiz. Tizimga kirishingiz mumkin.',
        });
        
        setTimeout(() => {
            navigate('/student');
            setIsLoading(false);
        }, 500);
    };

    const fillDemo = (role: 'admin' | 'student') => {
        if (role === 'admin') {
            setEmail('admin@abdiyev.uz');
            setPassword('admin123');
        } else {
            setEmail('student@abdiyev.uz');
            setPassword('student123');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
                <div className="absolute inset-0 " style={{
                    backgroundImage: `url(${bgImg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                }}
                />
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <div className="flex items-center gap-4 mb-8 bg-black/20 backdrop-blur-sm" style={{
                        borderRadius: '15px'
                    }}>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl ">
                            <GraduationCap className="h-10 w-10 text-white"/>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">ABDIYEV</h1>
                            <p className="text-lg text-white/80">SCHOOL</p>
                        </div>
                    </div>

                    <div className='bg-black/20 backdrop-blur-sm gap-4 p-8 rounded-xl'>
                        <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
                            Kimyo fanini<br/>oson o'rganing
                        </h2>
                        <p className="text-lg text-white/80 max-w-md">
                            Zamonaviy video darslar, interaktiv vazifalar va professional yondashuv bilan kimyoni
                            mukammal o'zlashtiring.
                        </p>

                        <div className="mt-12 grid grid-cols-3 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">15+</p>
                                <p className="text-sm text-white/70">Video darslar</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">4</p>
                                <p className="text-sm text-white/70">Kategoriya</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">100+</p>
                                <p className="text-sm text-white/70">O'quvchilar</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"/>
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"/>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                            <GraduationCap className="h-7 w-7 text-primary-foreground"/>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">ABDIYEV</h1>
                            <p className="text-xs text-muted-foreground">SCHOOL</p>
                        </div>
                    </div>

                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="login">Kirish</TabsTrigger>
                            <TabsTrigger value="signup">Ro'yxatdan o'tish</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-foreground mb-2">Tizimga kirish</h2>
                                <p className="text-muted-foreground">Email va parolingizni kiriting</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Parol</Label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10 h-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 gradient-primary text-primary-foreground font-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                                            Kirish...
                                        </>
                                    ) : (
                                        'Kirish'
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-foreground mb-2">Ro'yxatdan o'tish</h2>
                                <p className="text-muted-foreground">Yangi hisob yarating</p>
                            </div>

                            <form onSubmit={handleSignup} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-username">Foydalanuvchi nomi</Label>
                                    <div className="relative">
                                        <User
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                        <Input
                                            id="signup-username"
                                            type="text"
                                            placeholder="username"
                                            value={signupUsername}
                                            onChange={(e) => setSignupUsername(e.target.value)}
                                            className="pl-10 h-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Parol</Label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                        <Input
                                            id="signup-password"
                                            type={showSignupPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            className="pl-10 pr-10 h-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showSignupPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signup-confirm-password">Parolni tasdiqlash</Label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                        <Input
                                            id="signup-confirm-password"
                                            type={showSignupPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={signupConfirmPassword}
                                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                            className="pl-10 h-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 gradient-primary text-primary-foreground font-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                                            Ro'yxatdan o'tish...
                                        </>
                                    ) : (
                                        'Ro\'yxatdan o\'tish'
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    {/* Demo Accounts */}
                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border"/>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Demo hisoblar</span>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fillDemo('student')}
                                className="h-auto py-3 flex-col items-start text-left"
                            >
                                <span className="font-medium">O'quvchi</span>
                                <span className="text-xs text-muted-foreground">student@abdiyev.uz</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fillDemo('admin')}
                                className="h-auto py-3 flex-col items-start text-left"
                            >
                                <span className="font-medium">Admin</span>
                                <span className="text-xs text-muted-foreground">admin@abdiyev.uz</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
