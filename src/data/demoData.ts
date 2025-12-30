// Demo users
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'admin' | 'student';
  avatar?: string;
  createdAt: string;
  isBlocked: boolean;
}

export const demoUsers: User[] = [
  {
    id: '1',
    email: 'admin@abdiyev.uz',
    password: 'admin123',
    name: 'Abdiyev Ustoz',
    phone: '+998901234567',
    role: 'admin',
    createdAt: '2024-01-01',
    isBlocked: false,
  },
  {
    id: '2',
    email: 'student@abdiyev.uz',
    password: 'student123',
    name: 'Aziz Karimov',
    phone: '+998901112233',
    role: 'student',
    createdAt: '2024-06-15',
    isBlocked: false,
  },
  {
    id: '3',
    email: 'malika@abdiyev.uz',
    password: 'student123',
    name: 'Malika Rahimova',
    phone: '+998902223344',
    role: 'student',
    createdAt: '2024-07-20',
    isBlocked: false,
  },
  {
    id: '4',
    email: 'bobur@abdiyev.uz',
    password: 'student123',
    name: 'Bobur Aliyev',
    phone: '+998903334455',
    role: 'student',
    createdAt: '2024-08-10',
    isBlocked: true,
  },
  {
    id: '5',
    email: 'nilufar@abdiyev.uz',
    password: 'student123',
    name: 'Nilufar Sodiqova',
    phone: '+998904445566',
    role: 'student',
    createdAt: '2024-09-01',
    isBlocked: false,
  },
];

// Payments
export interface Payment {
  id: string;
  odId: string;
  amount: number;
  expiresAt: string;
  createdAt: string;
  status: 'active' | 'expired' | 'pending';
  description?: string;
}

export const demoPayments: Payment[] = [
  {
    id: 'pay-1',
    odId: '2',
    amount: 500000,
    expiresAt: '2025-01-15',
    createdAt: '2024-11-15',
    status: 'active',
    description: '2 oylik obuna',
  },
  {
    id: 'pay-2',
    odId: '3',
    amount: 250000,
    expiresAt: '2024-12-20',
    createdAt: '2024-11-20',
    status: 'active',
    description: '1 oylik obuna',
  },
  {
    id: 'pay-3',
    odId: '5',
    amount: 500000,
    expiresAt: '2025-02-01',
    createdAt: '2024-11-01',
    status: 'active',
    description: '3 oylik obuna',
  },
  {
    id: 'pay-4',
    odId: '4',
    amount: 250000,
    expiresAt: '2024-10-01',
    createdAt: '2024-09-01',
    status: 'expired',
    description: '1 oylik obuna',
  },
];

// User Courses (purchased/gifted courses)
export interface UserCourse {
  id: string;
  odId: string;
  categoryId: string;
  grantedAt: string;
  grantedBy: 'payment' | 'gift';
  expiresAt?: string;
}

export const demoUserCourses: UserCourse[] = [
  { id: 'uc-1', odId: '2', categoryId: 'cat-1', grantedAt: '2024-11-15', grantedBy: 'payment' },
  { id: 'uc-2', odId: '2', categoryId: 'cat-2', grantedAt: '2024-11-15', grantedBy: 'payment' },
  { id: 'uc-3', odId: '3', categoryId: 'cat-1', grantedAt: '2024-11-20', grantedBy: 'payment' },
  { id: 'uc-4', odId: '5', categoryId: 'cat-1', grantedAt: '2024-11-01', grantedBy: 'gift' },
  { id: 'uc-5', odId: '5', categoryId: 'cat-3', grantedAt: '2024-11-01', grantedBy: 'gift' },
];

// Categories
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  videoCount: number;
  price: number;
  createdAt: string;
}

export const demoCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Umumiy Kimyo',
    description: 'Kimyoning asosiy tushunchalari va qonunlari',
    icon: '⚗️',
    color: 'primary',
    videoCount: 5,
    price: 150000,
    createdAt: '2024-01-15',
  },
  {
    id: 'cat-2',
    name: 'Organik Kimyo',
    description: 'Uglerod birikmalarini o\'rganish',
    icon: '🧪',
    color: 'accent',
    videoCount: 4,
    price: 200000,
    createdAt: '2024-02-20',
  },
  {
    id: 'cat-3',
    name: 'Anorganik Kimyo',
    description: 'Metallar va metallmaslar kimyosi',
    icon: '🔬',
    color: 'success',
    videoCount: 3,
    price: 180000,
    createdAt: '2024-03-10',
  },
  {
    id: 'cat-4',
    name: 'Fizik Kimyo',
    description: 'Kimyoviy jarayonlarning fizik asoslari',
    icon: '📊',
    color: 'warning',
    videoCount: 3,
    price: 220000,
    createdAt: '2024-04-05',
  },
];

// Videos
export interface Video {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  order: number;
  createdAt: string;
  viewCount: number;
}

export const demoVideos: Video[] = [
  // Umumiy Kimyo
  {
    id: 'vid-1',
    categoryId: 'cat-1',
    title: 'Atom tuzilishi',
    description: 'Atomning tuzilishi, proton, neytron va elektronlar haqida',
    duration: '15:30',
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 1,
    createdAt: '2024-01-20',
    viewCount: 156,
  },
  {
    id: 'vid-2',
    categoryId: 'cat-1',
    title: 'Davriy jadval',
    description: 'Mendeleyev davriy jadvali va elementlarning xossalari',
    duration: '20:15',
    thumbnail: 'https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 2,
    createdAt: '2024-01-25',
    viewCount: 142,
  },
  {
    id: 'vid-3',
    categoryId: 'cat-1',
    title: 'Kimyoviy bog\'lanish',
    description: 'Kovalent, ion va metall bog\'lanishlar',
    duration: '18:45',
    thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 3,
    createdAt: '2024-02-01',
    viewCount: 98,
  },
  {
    id: 'vid-4',
    categoryId: 'cat-1',
    title: 'Mol tushunchasi',
    description: 'Avogadro soni va molyar massa',
    duration: '22:00',
    thumbnail: 'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 4,
    createdAt: '2024-02-10',
    viewCount: 87,
  },
  {
    id: 'vid-5',
    categoryId: 'cat-1',
    title: 'Kimyoviy reaksiyalar',
    description: 'Reaksiya turlari va tenglamalarni tenglashtirish',
    duration: '25:30',
    thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 5,
    createdAt: '2024-02-15',
    viewCount: 76,
  },
  // Organik Kimyo
  {
    id: 'vid-6',
    categoryId: 'cat-2',
    title: 'Alkanlar',
    description: 'To\'yingan uglevodorodlar va ularning xossalari',
    duration: '19:20',
    thumbnail: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 1,
    createdAt: '2024-03-01',
    viewCount: 112,
  },
  {
    id: 'vid-7',
    categoryId: 'cat-2',
    title: 'Alkenlar',
    description: 'To\'yinmagan uglevodorodlar, qo\'sh bog\'',
    duration: '17:45',
    thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 2,
    createdAt: '2024-03-10',
    viewCount: 95,
  },
  {
    id: 'vid-8',
    categoryId: 'cat-2',
    title: 'Spirtlar',
    description: 'Spirtlarning tuzilishi va xossalari',
    duration: '21:10',
    thumbnail: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 3,
    createdAt: '2024-03-20',
    viewCount: 88,
  },
  {
    id: 'vid-9',
    categoryId: 'cat-2',
    title: 'Karbon kislotalar',
    description: 'Organik kislotalar va ularning reaksiyalari',
    duration: '23:30',
    thumbnail: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 4,
    createdAt: '2024-03-25',
    viewCount: 72,
  },
  // Anorganik Kimyo
  {
    id: 'vid-10',
    categoryId: 'cat-3',
    title: 'Metallar',
    description: 'Metallarning umumiy xossalari va olinishi',
    duration: '20:00',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 1,
    createdAt: '2024-04-01',
    viewCount: 134,
  },
  {
    id: 'vid-11',
    categoryId: 'cat-3',
    title: 'Ishqoriy metallar',
    description: 'Natriy, kaliy va boshqa ishqoriy metallar',
    duration: '18:30',
    thumbnail: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 2,
    createdAt: '2024-04-10',
    viewCount: 98,
  },
  {
    id: 'vid-12',
    categoryId: 'cat-3',
    title: 'Galogenlar',
    description: 'Xlor, brom, yod va ularning birikmalari',
    duration: '16:45',
    thumbnail: 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 3,
    createdAt: '2024-04-15',
    viewCount: 87,
  },
  // Fizik Kimyo
  {
    id: 'vid-13',
    categoryId: 'cat-4',
    title: 'Termodinamika asoslari',
    description: 'Issiqlik va energiya almashinuvi',
    duration: '24:00',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 1,
    createdAt: '2024-05-01',
    viewCount: 67,
  },
  {
    id: 'vid-14',
    categoryId: 'cat-4',
    title: 'Kimyoviy kinetika',
    description: 'Reaksiya tezligi va uni ta\'sir etuvchi omillar',
    duration: '22:15',
    thumbnail: 'https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 2,
    createdAt: '2024-05-10',
    viewCount: 54,
  },
  {
    id: 'vid-15',
    categoryId: 'cat-4',
    title: 'Kimyoviy muvozanat',
    description: 'Muvozanat konstantasi va Le-Shatelye prinsipi',
    duration: '26:30',
    thumbnail: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=400&h=225&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    order: 3,
    createdAt: '2024-05-15',
    viewCount: 45,
  },
];

// Tasks
export interface Task {
  id: string;
  videoId: string;
  title: string;
  description: string;
  questions: TaskQuestion[];
  allowResubmission: boolean;
  createdAt: string;
}

export interface TaskQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const demoTasks: Task[] = [
  {
    id: 'task-1',
    videoId: 'vid-1',
    title: 'Atom tuzilishi bo\'yicha test',
    description: 'Bu testda atomning tuzilishi haqidagi bilimlaringizni tekshiramiz',
    allowResubmission: true,
    createdAt: '2024-01-22',
    questions: [
      {
        id: 'q1-1',
        question: 'Atomning markazida nima joylashgan?',
        options: ['Elektron', 'Yadro', 'Neytron', 'Proton'],
        correctAnswer: 1,
      },
      {
        id: 'q1-2',
        question: 'Elektronning zaryadi qanday?',
        options: ['Musbat', 'Manfiy', 'Neytral', 'O\'zgaruvchan'],
        correctAnswer: 1,
      },
      {
        id: 'q1-3',
        question: 'Proton va neytron yadro ichida qanday kuch bilan bog\'langan?',
        options: ['Elektr kuchi', 'Gravitatsiya', 'Yadro kuchi', 'Magnit kuchi'],
        correctAnswer: 2,
      },
    ],
  },
  {
    id: 'task-2',
    videoId: 'vid-2',
    title: 'Davriy jadval bo\'yicha test',
    description: 'Davriy jadval va elementlar xossalari haqida',
    allowResubmission: false,
    createdAt: '2024-01-27',
    questions: [
      {
        id: 'q2-1',
        question: 'Davriy jadvalda nechta davr bor?',
        options: ['5 ta', '6 ta', '7 ta', '8 ta'],
        correctAnswer: 2,
      },
      {
        id: 'q2-2',
        question: 'Qaysi element eng yengil metall?',
        options: ['Natriy', 'Litiy', 'Kaliy', 'Magniy'],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: 'task-3',
    videoId: 'vid-6',
    title: 'Alkanlar bo\'yicha test',
    description: 'To\'yingan uglevodorodlar haqida bilimlarni tekshirish',
    allowResubmission: true,
    createdAt: '2024-03-05',
    questions: [
      {
        id: 'q3-1',
        question: 'Metan formulasi qanday?',
        options: ['C2H6', 'CH4', 'C3H8', 'C4H10'],
        correctAnswer: 1,
      },
      {
        id: 'q3-2',
        question: 'Alkanlarning umumiy formulasi qanday?',
        options: ['CnH2n', 'CnH2n+2', 'CnH2n-2', 'CnHn'],
        correctAnswer: 1,
      },
    ],
  },
];

// Student Progress
export interface StudentProgress {
  odId: string;
  completedVideos: string[];
  completedTasks: string[];
  taskScores: { taskId: string; score: number; total: number }[];
}

export const initialStudentProgress: StudentProgress = {
  odId: '2',
  completedVideos: ['vid-1', 'vid-2'],
  completedTasks: ['task-1'],
  taskScores: [{ taskId: 'task-1', score: 2, total: 3 }],
};

// Notifications
export interface Notification {
  id: string;
  odId: string;
  title: string;
  message: string;
  type: 'payment' | 'course' | 'system';
  isRead: boolean;
  createdAt: string;
}

export const demoNotifications: Notification[] = [
  {
    id: 'notif-1',
    odId: '2',
    title: 'To\'lov eslatmasi',
    message: 'To\'lov muddati tugashiga 30 kun qoldi',
    type: 'payment',
    isRead: false,
    createdAt: '2024-11-28',
  },
  {
    id: 'notif-2',
    odId: '3',
    title: 'To\'lov eslatmasi',
    message: 'To\'lov muddati tugashiga 21 kun qoldi',
    type: 'payment',
    isRead: false,
    createdAt: '2024-11-28',
  },
];

// Helper functions
export const getUserById = (id: string) => demoUsers.find(u => u.id === id);
export const getCategoryById = (id: string) => demoCategories.find(c => c.id === id);
export const getVideoById = (id: string) => demoVideos.find(v => v.id === id);
export const getTaskById = (id: string) => demoTasks.find(t => t.id === id);

export const getUserPayments = (odId: string) => demoPayments.filter(p => p.odId === odId);
export const getUserCourses = (odId: string) => demoUserCourses.filter(uc => uc.odId === odId);
export const getActivePayment = (odId: string) => {
  const today = new Date().toISOString().split('T')[0];
  return demoPayments.find(p => p.odId === odId && p.status === 'active' && p.expiresAt >= today);
};

export const getDaysUntilExpiry = (expiresAt: string) => {
  const today = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
};

export const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
};


