import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateIslamicRandom = (min: number, max: number, count: number): Promise<number[]> => {
  return new Promise((resolve) => {
    // اسلامی طریقہ: تسبیح کی طرح نمبرز کو مکس کرنا
    const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    
    // 33 بار مکس کرنا (تسبیح کے دانوں کی طرح)
    const shuffleTimes = 33;
    
    const shuffleNumbers = () => {
      for (let i = 0; i < shuffleTimes; i++) {
        for (let j = numbers.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [numbers[j], numbers[k]] = [numbers[k], numbers[j]];
        }
      }
    };
    
    shuffleNumbers();
    
    // نتیجہ واپس کرنا
    setTimeout(() => {
      resolve(numbers.slice(0, count));
    }, 2000); // 2 سیکنڈ کی ڈیلے اسلامی طریقے کے لیے
  });
};
