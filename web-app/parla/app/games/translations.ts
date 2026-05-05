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
                fillInTheBlank: {
                    title: "Completa el Espacio",
                    desc: "Completa las oraciones con las palabras que faltan.",
                },
                wordMatch: {
                    title: "Emparejar Palabras",
                    desc: "Encuentra pares que coincidan entre palabras y sus significados.",
                },
                typing: {
                    title: "Entrenamiento de Escritura",
                    desc: "Pon a prueba tu velocidad y precisión escribiendo palabras.",
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
                fillInTheBlank: {
                    title: "Fill-in-the-blank",
                    desc: "Complete the sentences with the missing words.",
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
