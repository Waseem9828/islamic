import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateIslamicRandom = (min: number, max: number, count: number, sourceArray?: number[]): Promise<number[]> => {
  return new Promise((resolve) => {
    // اسلامی طریقہ: تسبیح کی طرح نمبرز کو مکس کرنا
    const numbers = sourceArray ? [...sourceArray] : Array.from({ length: max - min + 1 }, (_, i) => min + i);
    
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
      if (sourceArray) {
        // If a source array is provided, we might not need to slice, just return the shuffled 'count' items.
        // But the user's new logic requires selecting FROM the source, not just shuffling it.
        const result = [];
        const available = [...sourceArray];
        for(let i=0; i<count; i++) {
            if(available.length === 0) break;
            const randomIndex = Math.floor(Math.random() * available.length);
            result.push(available.splice(randomIndex, 1)[0]);
        }
        resolve(result);

      } else {
         resolve(numbers.slice(0, count));
      }
    }, 500); // ڈیلے کم کر دیا تاکہ تیز ہو
  });
};
