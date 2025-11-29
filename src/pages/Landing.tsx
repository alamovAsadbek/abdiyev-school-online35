import { Link } from 'react-router-dom';
import { GraduationCap, Play, BookOpen, Award, Users, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Play,
      title: 'Video darsliklar',
      description: 'Professional darajadagi video darsliklar orqali oson va tez o\'rganish',
    },
    {
      icon: BookOpen,
      title: 'Amaliy vazifalar',
      description: 'Bilimlaringizni mustahkamlash uchun amaliy mashqlar va topshiriqlar',
    },
    {
      icon: Award,
      title: 'Yutuqlar tizimi',
      description: 'O\'z muvaffaqiyatlaringizni kuzating va yangi cho\'qqilarni zabt eting',
    },
    {
      icon: TrendingUp,
      title: 'Progress monitoring',
      description: 'Shaxsiy rivojlanishingizni kuzatib boring va tahlil qiling',
    },
  ];

  const stats = [
    { value: '500+', label: 'Video darslik' },
    { value: '1000+', label: 'O\'quvchi' },
    { value: '50+', label: 'Mavzu' },
    { value: '95%', label: 'Qoniqish' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-foreground">ABDIYEV SCHOOL</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Online ta'lim platformasi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={toggleTheme} size="icon" className="text-muted-foreground">
                {theme === 'dark' ? '🌞' : '🌙'}
              </Button>
              <Link to="/login">
                <Button className="gradient-primary text-primary-foreground">
                  Kirish
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-scale-in">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">1000+ o'quvchi bizga ishonadi</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Kimyo fanini o'rganishning{' '}
              <span className="gradient-text">eng zamonaviy</span> usuli
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Professional o'qituvchilar, sifatli video darsliklar va amaliy mashqlar orqali kimyo fanini chuqur o'rganing
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-primary-foreground w-full sm:w-auto shadow-glow">
                  Boshlash
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Play className="mr-2 h-5 w-5" />
                Demo ko'rish
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mt-20 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center glass hover-lift">
                <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Nima uchun <span className="gradient-text">ABDIYEV SCHOOL</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Zamonaviy texnologiyalar va tajribali o'qituvchilar bilan bilim olish yanada oson
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover-lift glass animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-left">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                O'quvchilar uchun maxsus imkoniyatlar
              </h2>
              <div className="space-y-4">
                {[
                  'Istalgan vaqt va joydan darslarni tomosha qilish',
                  'Shaxsiy progress tracking va hisobotlar',
                  'Amaliy vazifalar va real testlar',
                  'Professional o\'qituvchilar bilan aloqa',
                  'Sertifikat olish imkoniyati',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="absolute inset-0 gradient-hero opacity-20 blur-3xl"></div>
              <Card className="p-8 glass-strong relative">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
                      <GraduationCap className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">Bugun boshlang</div>
                      <div className="text-muted-foreground">Kelajagingizni quring</div>
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <p className="text-muted-foreground">
                    Minglab o'quvchilar ABDIYEV SCHOOL platformasi orqali o'z maqsadlariga erishmoqda. Siz ham bugun ular qatoriga qo'shiling!
                  </p>
                  <Link to="/login">
                    <Button size="lg" className="w-full gradient-primary text-primary-foreground">
                      Ro'yxatdan o'tish
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-foreground">ABDIYEV SCHOOL</div>
                <div className="text-sm text-muted-foreground">Online ta'lim platformasi</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center lg:text-left">
              © 2024 ABDIYEV SCHOOL. Barcha huquqlar himoyalangan.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
