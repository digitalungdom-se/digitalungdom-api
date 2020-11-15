import wordList from "./eff_long_word_list.json";

export function randomWordArray(length: number): string[] {
  const words = [];

  for (let i = 0; i < length; i++) {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)]!;
    words.push(randomWord);
  }

  return words;
}
