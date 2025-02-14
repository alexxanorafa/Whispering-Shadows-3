document.addEventListener("DOMContentLoaded", function() {
    const menuIcon = document.getElementById("menuIcon");
    const menu = document.getElementById("menu");
    const ambienceSound = new Audio('ambience.mp3');
    
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
            this.style.boxShadow = "0 4px 15px rgba(212, 177, 146, 0.5)";
        });
        
        item.addEventListener("mouseleave", function() {
            this.style.transform = "translateY(0)";
            this.style.boxShadow = "none";
        });
    });

    // Sistema do Jogo
    const gameState = {
        sanity: 100,
        karma: 0,
        inventory: new Map(),
        currentScenario: 'entrance',
        previousScenarios: [],
        puzzleHistory: new Set()
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

        secret_garden: {
            text: "Você encontra um jardim secreto com estátuas cobertas de musgo. Uma fonte seca contém algo brilhante...",
            image: "garden.jpg",
            choices: [
                {
                    text: "Pegar objeto brilhante",
                    next: "hall",
                    effect: () => gameState.inventory.set("cristal_arcano", {type: "artefact"})
                },
                {
                    text: "Voltar para entrada",
                    next: "entrance"
                }
            ]
        },

        bedroom: {
            text: "O quarto principal está intacto. Um baú ornamentado está aos pés da cama...",
            image: "bedroom.jpg",
            choices: [
                {
                    text: "Abrir baú",
                    requiredItem: "chave_ferrugenta",
                    next: "treasure_room"
                },
                {
                    text: "Voltar ao corredor",
                    next: "upper_floor"
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

        ritual_reveal: {
            text: "O diário revela um ritual antigo. Você precisa reunir três artefatos:",
            image: "ritual.jpg",
            choices: [
                {
                    text: "[Procurar medalhão]",
                    next: "hall"
                },
                {
                    text: "[Procurar cristal]",
                    next: "secret_garden"
                }
            ]
        },

        treasure_room: {
            text: "Dentro do baú: pergaminhos antigos e uma adaga ritualística!",
            image: "treasure.jpg",
            choices: [
                {
                    text: "Levar adaga",
                    next: "upper_floor",
                    effect: () => gameState.inventory.set("adaga_ritual", {type: "weapon"})
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
            const puzzleHTML = `
                <div class="puzzle-box">
                    <p class="puzzle-question">${puzzleData.question}</p>
                    <input type="text" id="puzzle-input" placeholder="Insira sua resposta...">
                    <button class="puzzle-submit" onclick="submitPuzzle()">Submeter</button>
                    <div class="puzzle-hint">Dica: ${this.getHint(puzzleData.type)}</div>
                </div>`;
            document.getElementById('puzzle-container').innerHTML = puzzleHTML;
        },

        getHint(type) {
            const hints = {
                combination: "Números romanos convertidos para arábicos",
                ancient_code: "Palavra em latim para 'águia'"
            };
            return hints[type] || "Observe os detalhes do ambiente";
        },

        checkSolution(answer) {
            const cleanAnswer = answer.toLowerCase().replace(/[\s-]/g, '');
            return cleanAnswer === this.activePuzzle.solution.toLowerCase().replace(/[\s-]/g, '');
        }
    };

    window.submitPuzzle = () => {
        const answer = document.getElementById('puzzle-input').value;
        const puzzleContainer = document.getElementById('puzzle-container');
        
        if (puzzleSystem.checkSolution(answer)) {
            gameState.inventory.set(puzzleSystem.activePuzzle.reward, { type: "key" });
            puzzleContainer.innerHTML = `<div class="puzzle-success">✓ Resposta Correta!</div>`;
            updateInventoryUI();
            
            setTimeout(() => {
                puzzleContainer.innerHTML = "";
                loadScenario(gameState.currentScenario);
            }, 2000);
        } else {
            puzzleContainer.classList.add('puzzle-error');
            gameState.sanity -= 15;
            updateSanityDisplay();
            
            setTimeout(() => {
                puzzleContainer.classList.remove('puzzle-error');
            }, 1000);
        }
    };

    // Funções Principais
    function updateInventoryUI() {
        const inventoryUI = document.getElementById('inventoryUI');
        inventoryUI.innerHTML = '';
        
        gameState.inventory.forEach((item, id) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.style.backgroundImage = `url('items/${id}.png')`;
            itemElement.setAttribute('data-item', id);
            inventoryUI.appendChild(itemElement);
        });
    }

    function loadScenario(scenarioId) {
        const scenario = scenarios[scenarioId];
        gameState.currentScenario = scenarioId;
        
        // Atualizar elementos visuais
        document.getElementById('game-text').textContent = scenario.text;
        document.getElementById('scene').style.backgroundImage = `url('scenes/${scenario.image}')`;
        
        // Gerar escolhas
        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = '';
        
        // Adicionar botão de voltar
        if (gameState.previousScenarios.length > 0) {
            const backButton = document.createElement('button');
            backButton.className = 'button-style back-button';
            backButton.textContent = '← Voltar';
            backButton.onclick = () => {
                const prevScenario = gameState.previousScenarios.pop();
                loadScenario(prevScenario);
            };
            choicesContainer.appendChild(backButton);
        }

        // Gerar opções principais
        scenario.choices.forEach(choice => {
            if (choice.requiredItem && !gameState.inventory.has(choice.requiredItem)) return;
            
            const button = document.createElement('button');
            button.className = 'button-style';
            button.textContent = choice.text;
            button.onclick = () => handleChoice(choice.next);
            
            if (choice.effect) button.dataset.effect = true;
            choicesContainer.appendChild(button);
        });

        // Adicionar item ao inventário
        if (scenario.item && !gameState.inventory.has(scenario.item.id)) {
            gameState.inventory.set(scenario.item.id, scenario.item);
            updateInventoryUI();
        }

        updateSanityDisplay();
        ambienceSound.play();
    }

    window.handleChoice = (nextScenario) => {
        const currentScenario = scenarios[gameState.currentScenario];
        const choice = currentScenario.choices.find(c => c.next === nextScenario);
        
        if (!choice) return;
        
        gameState.previousScenarios.push(gameState.currentScenario);
        
        if (choice.effect) choice.effect();
        if (choice.puzzle && !gameState.puzzleHistory.has(choice.puzzle.question)) {
            puzzleSystem.startPuzzle(choice.puzzle);
            gameState.puzzleHistory.add(choice.puzzle.question);
        } else {
            loadScenario(nextScenario);
        }
    };

    function updateSanityDisplay() {
        const sanityBar = document.getElementById('sanityBar');
        sanityBar.style.width = `${gameState.sanity}%`;
        document.body.className = gameState.sanity < 30 ? 'low-sanity' : '';
        
        if (gameState.sanity <= 0) {
            loadScenario('cursed_fate');
        }
    }

    // Inicialização
    ambienceSound.volume = 0.3;
    loadScenario('entrance');
    
    setInterval(() => {
        gameState.sanity = Math.max(0, gameState.sanity - 0.5);
        updateSanityDisplay();
    }, 10000);
});
