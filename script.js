document.addEventListener("DOMContentLoaded", function() {
    const menuIcon = document.getElementById("menuIcon");
    const menu = document.getElementById("menu");

    // Sistema de Menu
    menuIcon.addEventListener("click", function(e) {
        e.stopPropagation();
        menu.classList.toggle("active");
        menuIcon.classList.toggle("active");
    });

    document.addEventListener("click", function(e) {
        if (!menu.contains(e.target) && !menuIcon.contains(e.target)) {
            menu.classList.remove("active");
            menuIcon.classList.remove("active");
        }
    });

    document.querySelectorAll(".menu-item").forEach(item => {
        item.addEventListener("mouseenter", function() {
            this.style.transform = "translateY(-3px)";
        });
        
        item.addEventListener("mouseleave", function() {
            this.style.transform = "translateY(0)";
        });
    });

    // Sistema do Jogo
    const gameState = {
        sanity: 100,
        inventory: new Map(),
        currentScenario: 'entrance',
        previousScenarios: []
    };

    const scenarios = {
        entrance: {
            text: "A porta rangendo ecoa no silêncio. Um cheiro de mofo invade suas narinas...",
            image: "entrance.jpg",
            choices: [
                { 
                    text: "Forçar a porta", 
                    next: "hall",
                    effect: () => gameState.sanity -= 10
                },
                { 
                    text: "Procurar entrada alternativa", 
                    next: "secret_garden",
                    requiredItem: "lanterna",
                    effect: () => gameState.karma += 5
                }
            ],
            item: { id: "chave_ferrugenta", type: "key" }
        },
        
        hall: {
            text: "O hall principal está em ruínas. Um retrato quebrado observa você...",
            image: "hall.jpg",
            choices: [
                {
                    text: "Subir escada carcomida",
                    next: "upper_floor",
                    effect: () => gameState.sanity -= 20
                },
                {
                    text: "Examinar a lareira",
                    puzzle: {
                        type: "combination",
                        question: "Sequência no relógio quebrado (IX, III, VII):",
                        solution: "9-3-7",
                        reward: "medalhão_prateado"
                    },
                    requiredItem: "fósforos"
                }
            ]
        },

        upper_floor: {
            text: "O andar superior range sob seus passos. Algo se move nas sombras...",
            image: "upper_floor.jpg",
            choices: [
                {
                    text: "Abrir a porta à esquerda",
                    next: "library",
                    effect: () => gameState.sanity -= 10
                },
                {
                    text: "Seguir o corredor",
                    next: "bedroom",
                    effect: () => gameState.karma -= 5
                }
            ]
        },

        library: {
            text: "Livros empoeirados enchem as prateleiras. Um diário se destaca...",
            image: "library.jpg",
            choices: [
                {
                    text: "Ler o diário",
                    next: "ritual_reveal",
                    effect: () => gameState.inventory.set("diário_ocultista", { type: "puzzle" })
                },
                {
                    text: "Procurar passagem secreta",
                    puzzle: {
                        type: "ancient_code",
                        question: "Decifre o símbolo ancestral:",
                        solution: "aquila",
                        reward: "pergaminho_místico"
                    }
                }
            ]
        },

        cursed_fate: {
            text: "As sombras se fecham ao seu redor... Você nunca mais sairá desta casa.",
            image: "cursed_fate.jpg",
            choices: [{
                text: "▶ Reiniciar Jogo",
                next: "entrance",
                effect: () => location.reload()
            }]
        },

        true_ending: {
            text: "O ritual é completado. Os sussurros cessam. Você libertou as almas presas aqui...",
            image: "true_ending.jpg",
            choices: [{
                text: "▶ Jogar novamente",
                next: "entrance",
                effect: () => location.reload()
            }]
        }
    };

    // Sistema de Puzzles
    const puzzleSystem = {
        activePuzzle: null,
        startPuzzle(puzzleData) {
            this.activePuzzle = puzzleData;
            document.getElementById('puzzle-container').innerHTML = `
                <div class="puzzle-box">
                    <p>${puzzleData.question}</p>
                    <input type="text" id="puzzle-input">
                    <button onclick="submitPuzzle()">Submeter</button>
                </div>`;
        },
        checkSolution(answer) {
            const cleanAnswer = answer.replace(/[\s-]/g, '');
            return cleanAnswer === this.activePuzzle.solution.replace(/[\s-]/g, '');
        }
    };

    window.submitPuzzle = () => {
        const answer = document.getElementById('puzzle-input').value;
        if (puzzleSystem.checkSolution(answer)) {
            gameState.inventory.set(puzzleSystem.activePuzzle.reward, { type: "key" });
            document.getElementById('puzzle-container').innerHTML = "";
            loadScenario(gameState.currentScenario);
        } else {
            document.body.style.filter = 'grayscale(100%)';
            setTimeout(() => document.body.style.filter = '', 1000);
        }
    };

    // Funções Principais
    function loadScenario(scenarioId) {
        const scenario = scenarios[scenarioId];
        gameState.currentScenario = scenarioId;
        
        document.getElementById('game-text').textContent = scenario.text;
        document.getElementById('scene').style.backgroundImage = `url('${scenario.image}')`;

        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = scenario.choices
            .filter(choice => !choice.requiredItem || gameState.inventory.has(choice.requiredItem))
            .map(choice => `
                <button class="button-style" onclick="handleChoice('${choice.next}')">
                    ${choice.text}
                </button>
            `).join('');

        if (scenario.item) {
            gameState.inventory.set(scenario.item.id, scenario.item);
        }

        updateSanityDisplay();
    }

    window.handleChoice = (nextScenario) => {
        const choice = scenarios[gameState.currentScenario].choices.find(c => c.next === nextScenario);
        if (choice?.effect) choice.effect();
        
        if (choice?.puzzle) {
            puzzleSystem.startPuzzle(choice.puzzle);
        } else {
            loadScenario(nextScenario);
        }
    };

    function updateSanityDisplay() {
        const sanityBar = document.getElementById('sanityBar');
        sanityBar.style.width = `${gameState.sanity}%`;
        document.body.classList.toggle('low-sanity', gameState.sanity < 30);
        
        if (gameState.sanity <= 0) {
            loadScenario('cursed_fate');
        }
    }

    // Inicialização
    loadScenario('entrance');
    setInterval(() => {
        gameState.sanity = Math.max(0, gameState.sanity - 0.5);
        updateSanityDisplay();
    }, 10000);
});