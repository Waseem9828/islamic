import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueRandomNumbers(max: number, count: number): number[] {
  if (count > max) {
    throw new Error("Cannot generate more unique numbers than the maximum range.");
  }
  
  const numbers = Array.from({ length: max }, (_, i) => i + 1);
  
  let currentIndex = numbers.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [numbers[currentIndex], numbers[randomIndex]] = [
      numbers[randomIndex], numbers[currentIndex]];
  }
  
  return numbers.slice(0, count);
}
