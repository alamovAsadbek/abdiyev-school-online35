import pandas as pd
import matplotlib.pyplot as plt

# 1. Ma'lumotlarni yuklash
# CSV fayldagi ma'lumotlar ';' bilan ajratilgan va o'nlik kasrlar ',' bilan yozilgan
df = pd.read_csv('04 VF.CSV', sep=';', decimal=',', header=None)

# X va Y o'qlarini belgilash
x = df[0]  # To'lqin soni (Wavenumber)
y = df[1]  # Intensivlik / O'tkazuvchanlik (Transmittance)

# 2. Grafik o'lchamlari va chizig'ini sozlash
plt.figure(figsize=(10, 6))
plt.plot(x, y, color='black', linewidth=1.5)

# 3. IR spektr standartlari
# X o'qini teskari qilish (Odatda 4000 dan 400 cm⁻¹ ga qarab yoziladi)
plt.xlim(max(x), min(x))

# Y o'qini teskari qilish - cho'qqilar tepadan pastga qarab "osilib turishi" uchun
plt.gca().invert_yaxis()

# 4. Dizayn va yozuvlar
plt.title('IR Spektr (04 VF)', fontsize=14, fontweight='bold')
plt.xlabel('To\'lqin soni (cm⁻¹)', fontsize=12)
plt.ylabel('O\'tkazuvchanlik', fontsize=12)

# Orqa fonga yengil to'r (grid) qo'shish
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()

# 5. Yuqori sifatli rasm sifatida saqlash va ko'rsatish
plt.savefig('IR_Spectrum_04_VF.png', dpi=300)
plt.show()