import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {useEffect, useState} from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
};


export function ClockText() {
  const [dateTime, setDateTime] = useState<string>("");

  // Funksiya: hozirgi sana + vaqt
  function getFormattedDateTime(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();

    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  }

  useEffect(() => {
    // Dastlab bir marta o‘rnatish
    setDateTime(getFormattedDateTime());

    // Keyin har 1 sekund yangilash
    const interval = setInterval(() => {
      setDateTime(getFormattedDateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // MUHIM: object emas, string return qilinadi
  return dateTime;
}