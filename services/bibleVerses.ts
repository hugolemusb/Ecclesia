import { BibleVerse } from '../types/cleaning';

export const CLEANING_BIBLE_VERSES: BibleVerse[] = [
  {
    text: "Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos",
    reference: "Mateo 18:20"
  },
  {
    text: "Todo lo que te viniere a la mano para hacer, hazlo según tus fuerzas",
    reference: "Eclesiastés 9:10"
  },
  {
    text: "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres",
    reference: "Colosenses 3:23"
  },
  {
    text: "Cada uno según el don que ha recibido, minístrelo a los otros, como buenos administradores",
    reference: "1 Pedro 4:10"
  },
  {
    text: "El que es fiel en lo muy poco, también en lo más es fiel",
    reference: "Lucas 16:10"
  },
  {
    text: "Servíos por amor los unos a los otros",
    reference: "Gálatas 5:13"
  },
  {
    text: "Porque Dios no es injusto para olvidar vuestra obra y el trabajo de amor que habéis mostrado",
    reference: "Hebreos 6:10"
  },
  {
    text: "Mejor es un plato de legumbres donde hay amor, que buey engordado donde hay odio",
    reference: "Proverbios 15:17"
  },
  {
    text: "La santidad conviene a tu casa, oh Jehová, por los siglos y para siempre",
    reference: "Salmos 93:5"
  },
  {
    text: "Porque la casa de Dios es la casa de oración",
    reference: "Marcos 11:17"
  }
];

export const getRandomVerse = (): BibleVerse => {
  const randomIndex = Math.floor(Math.random() * CLEANING_BIBLE_VERSES.length);
  return CLEANING_BIBLE_VERSES[randomIndex];
};
