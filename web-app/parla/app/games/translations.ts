export const translations = {
    es: {
        dashboard: {
            title: "Arcade Parla",
            subtitle: "¡Practica tu vocabulario guardado con nuestros mini-juegos interactivos!",
            games: {
                fillInTheWord: {
                    title: "Completa la Palabra",
                    desc: "Escribe la palabra que falta en la frase usando tu vocabulario guardado.",
                },
                stopwatch: {
                    title: "Contrarreloj",
                    desc: "Elige la traducción correcta antes de que se acabe el tiempo.",
                },
                matching: {
                    title: "Emparejar",
                    desc: "Conecta cada frase con su traducción correcta.",
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
            xpEarned: "XP ganado",
            correct: "Correctas",
            wrong: "Incorrectas",
            loading: "Cargando frases...",
            notEnoughPhrases: "Necesitas al menos 4 frases guardadas para jugar.",
            goToVocabulary: "Ir a Vocabulario",
        },
        fillInTheWord: {
            instruction: "Escribe la palabra que falta:",
            placeholder: "Tu respuesta...",
            check: "Verificar",
            next: "Siguiente",
            hintLabel: "Pista: primera letra es",
        },
        stopwatch: {
            timeLeft: "Tiempo",
            question: "¿Cuál es la traducción de",
            chooseCorrect: "Elige la traducción correcta",
        },
        matching: {
            instruction: "Conecta cada frase con su traducción",
            original: "Original",
            translation: "Traducción",
            mismatches: "Errores",
            pairs: "Pares",
        },
    },
    en: {
        dashboard: {
            title: "Arcade Parla",
            subtitle: "Practice your saved vocabulary with our interactive mini-games!",
            games: {
                fillInTheWord: {
                    title: "Fill in the Word",
                    desc: "Type the missing word in a phrase from your saved vocabulary.",
                },
                stopwatch: {
                    title: "Stopwatch",
                    desc: "Choose the correct translation before time runs out.",
                },
                matching: {
                    title: "Matching",
                    desc: "Connect each phrase with its correct translation.",
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
            xpEarned: "XP earned",
            correct: "Correct",
            wrong: "Wrong",
            loading: "Loading phrases...",
            notEnoughPhrases: "You need at least 4 saved phrases to play.",
            goToVocabulary: "Go to Vocabulary",
        },
        fillInTheWord: {
            instruction: "Type the missing word:",
            placeholder: "Your answer...",
            check: "Check",
            next: "Next",
            hintLabel: "Hint: first letter is",
        },
        stopwatch: {
            timeLeft: "Time",
            question: "What is the translation of",
            chooseCorrect: "Choose the correct translation",
        },
        matching: {
            instruction: "Connect each phrase with its translation",
            original: "Original",
            translation: "Translation",
            mismatches: "Errors",
            pairs: "Pairs",
        },
    },
};

export type Language = "es" | "en";
export type TranslationDict = typeof translations.es;
