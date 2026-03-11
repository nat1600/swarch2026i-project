export const translations = {
    es: {
        dashboard: {
            title: "Arcade Parla",
            subtitle: "¡Sube de nivel tus habilidades lingüísticas con nuestros mini-juegos interactivos!",
            games: {
                fillInTheBlank: {
                    title: "Completa el Espacio",
                    desc: "Completa las oraciones con las palabras que faltan de tu vocabulario.",
                },
                wordMatch: {
                    title: "Emparejar Palabras",
                    desc: "Encuentra pares que coincidan entre palabras y sus significados.",
                },
                typing: {
                    title: "Entrenamiento de Escritura",
                    desc: "Pon a prueba tu velocidad y precisión escribiendo palabras que caen.",
                },
            },
        },
        common: {
            back: "Volver",
            score: "Puntaje",
            gameOver: "Juego Terminado",
            playAgain: "Jugar de Nuevo",
            perfect: "¡Perfecto!",
            keepGoing: "¡Sigue así!",
            levelCleared: "¡Nivel Superado!",
            exit: "Salir",
        },
        fillInTheBlank: {
            instruction: "Elige la palabra correcta:",
        },
        wordMatch: {
            moves: "Movimientos",
            pairs: "Pares",
        },
        typing: {
            placeholder: "Escribe aquí...",
            wpm: "PPM",
            accuracy: "Precisión",
            timer: "Tiempo",
            start: "Comenzar",
        },
    },
    en: {
        dashboard: {
            title: "Arcade Parla",
            subtitle: "Level up your language skills with our interactive mini-games!",
            games: {
                fillInTheBlank: {
                    title: "Fill-in-the-blank",
                    desc: "Complete the sentences with the missing words from your vocabulary.",
                },
                wordMatch: {
                    title: "Word Match",
                    desc: "Find matching pairs between words and their meanings.",
                },
                typing: {
                    title: "Typing Training",
                    desc: "Test your speed and accuracy by typing falling words.",
                },
            },
        },
        common: {
            back: "Back",
            score: "Score",
            gameOver: "Game Over",
            playAgain: "Play Again",
            perfect: "Perfect!",
            keepGoing: "Keep going!",
            levelCleared: "Level Cleared!",
            exit: "Exit",
        },
        fillInTheBlank: {
            instruction: "Choose the correct word:",
        },
        wordMatch: {
            moves: "Moves",
            pairs: "Pairs",
        },
        typing: {
            placeholder: "Type here...",
            wpm: "WPM",
            accuracy: "Accuracy",
            timer: "Timer",
            start: "Start",
        },
    },
};

export type Language = "es" | "en";
export type TranslationDict = typeof translations.es;
