import { Quote } from "./types";

export const BUILT_IN_QUOTES: Quote[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "不积跬步，无以至千里；不积小流，无以成江海。", author: "荀子" },
  { text: "千里之行，始于足下。", author: "老子" },
  { text: "学而不思则罔，思而不学则殆。", author: "孔子" },
  { text: "天行健，君子以自强不息。", author: "《周易》" },
  { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原" },
  { text: "知之者不如好之者，好之者不如乐之者。", author: "孔子" },
];

export function getRandomQuote(): Quote {
  return BUILT_IN_QUOTES[Math.floor(Math.random() * BUILT_IN_QUOTES.length)];
}
