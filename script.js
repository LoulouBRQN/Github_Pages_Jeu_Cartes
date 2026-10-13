let cards = [];
let playerDeck = [], computerDeck = [], playerDiscard = [], computerDiscard = [];
let playerHand = [], computerHand = [];
let playerScore = 0, computerScore = 0, round = 1, attacker = "computer";
let phase = "playing";
let currentResult = null;

const labels = {
    force: "💪 Force",
    intelligence: "🧠 Intelligence",
    agilite: "⚡ Agilité",
    dangerosite: "☠️ Dangerosité"
};

const keys = Object.keys(labels);

async function loadCards() {
    const r = await fetch("cartes.json");
    cards = await r.json();

    if (cards.length < 20) {
        showMessage("⚠️ Ajoute tes 20 personnages dans cartes.json avant de jouer.");
    }

    startGame();
}

function shuffle(a) {
    return [...a].sort(() => Math.random() - 0.5);
}

function draw(deck, discard) {
    if (deck.length === 0 && discard.length) {
        deck.push(...shuffle(discard.splice(0)));
    }

    return deck.pop();
}

function refill(who, n) {
    const deck = who === "player" ? playerDeck : computerDeck;
    const disc = who === "player" ? playerDiscard : computerDiscard;
    const hand = who === "player" ? playerHand : computerHand;

    while (hand.length < n) {
        let c = draw(deck, disc);

        if (!c) {
            break;
        }

        hand.push(c);
    }
}

function startGame() {
    playerScore = computerScore = 0;
    round = 1;
    attacker = "computer";
    phase = "playing";
    currentResult = null;

    playerDeck = shuffle(cards).slice(0, Math.ceil(cards.length / 2));

    computerDeck = shuffle(
        cards.filter(c => !playerDeck.some(p => p.id === c.id))
    );

    playerDiscard = [];
    computerDiscard = [];
    playerHand = [];
    computerHand = [];

    refill("player", 2);
    refill("computer", 1);

    render();
    beginRound();
}

function beginRound() {
    phase = "playing";
    currentResult = null;

    refill("player", attacker === "player" ? 1 : 2);
    refill("computer", attacker === "computer" ? 1 : 2);

    updateTurn();
    render();

    if (attacker === "computer") {
        computerAttack();
    } else {
        playerAttack();
    }
}

function bestStat(card) {
    return keys.reduce(
        (best, k) => card[k] > card[best] ? k : best,
        keys[0]
    );
}

function computerAttack() {
    const stat = bestStat(computerHand[0]);

    showMessage(
        "L'ordinateur a choisi " + labels[stat] + " pour attaquer."
    );

    document.getElementById("controls").innerHTML = "";

    document.querySelectorAll("#playerHand .card").forEach((el, i) => {
        el.classList.add("selectable");
        el.onclick = () => resolve(i, stat);
    });
}

function playerAttack() {
    const card = playerHand[0];

    showMessage(
        "Tu attaques avec " + card.nom + ". Choisis une compétence."
    );

    document.getElementById("controls").innerHTML = keys
        .map(k => `<button onclick="resolve(0,'${k}')">${labels[k]}</button>`)
        .join("");
}

function resolve(playerIndex, stat) {
    if (phase !== "playing") {
        return;
    }

    const pCard = playerHand[playerIndex];
    const cCard = computerHand[0];

    const p = pCard[stat];
    const c = cCard[stat];

    let winner = p > c
        ? "player"
        : c > p
            ? "computer"
            : "tie";

    playerHand.splice(playerIndex, 1);
    computerHand.splice(0, 1);

    if (winner === "player") {
        playerScore++;
        playerDiscard.push(pCard, cCard);
    } else if (winner === "computer") {
        computerScore++;
        computerDiscard.push(pCard, cCard);
    } else {
        playerDiscard.push(pCard);
        computerDiscard.push(cCard);
    }

    currentResult = {
        pCard,
        cCard,
        stat,
        p,
        c,
        winner
    };

    phase = "result";

    renderResult();

    document.getElementById("controls").innerHTML = `
        <button class="next" onclick="nextRound()">
            ➡️ Passer à la manche suivante
        </button>
    `;

    if (playerScore >= 7 || computerScore >= 7) {
        document.getElementById("controls").innerHTML = `
            <button class="next" onclick="finishGame()">
                🏆 Voir le résultat final
            </button>
        `;
    }
}

function nextRound() {
    if (playerScore >= 7 || computerScore >= 7) {
        finishGame();
        return;
    }

    attacker = attacker === "computer"
        ? "player"
        : "computer";

    round++;

    beginRound();
}

function finishGame() {
    phase = "finished";

    const playerWon = playerScore >= 7;

    // On remplace complètement l'écran du jeu
    document.body.innerHTML = `
        <div class="end-screen ${playerWon ? "victory" : "defeat"}">
            <div class="end-content">
                <div class="end-icon">
                    ${playerWon ? "🏆" : "🤖"}
                </div>

                <h1>
                    ${playerWon ? "VICTOIRE !" : "DÉFAITE !"}
                </h1>

                <button class="next" onclick="location.reload()">
                    🔄 Rejouer
                </button>
            </div>
        </div>
    `;
}

function renderResult() {
    document.getElementById("playerScore").textContent = playerScore;
    document.getElementById("computerScore").textContent = computerScore;
    document.getElementById("roundNumber").textContent = Math.min(round, 13);

    const title = currentResult.winner === "tie"
        ? "🤝 Égalité !"
        : currentResult.winner === "player"
            ? "👤 Tu gagnes la manche !"
            : "🤖 L'ordinateur gagne la manche !";

    document.getElementById("turnTitle").textContent = title;

    showMessage(
        `${labels[currentResult.stat]} : ${currentResult.p} contre ${currentResult.c}`
    );

    document.getElementById("playerHand").innerHTML =
        makeCard(currentResult.pCard, false);

    document.getElementById("computerHand").innerHTML =
        makeCard(currentResult.cCard, false);
}

function render() {
    document.getElementById("playerScore").textContent = playerScore;
    document.getElementById("computerScore").textContent = computerScore;
    document.getElementById("roundNumber").textContent = Math.min(round, 13);

    renderPlayer();
    renderComputer();
}

function renderPlayer() {
    document.getElementById("playerHand").innerHTML = playerHand
        .map((c, i) => makeCard(
            c,
            attacker === "computer" && phase === "playing",
            i
        ))
        .join("");
}

function renderComputer() {
    document.getElementById("computerHand").innerHTML =
        computerHand.length
            ? '<div class="back-card">🃏</div>'
            : "";
}

function makeCard(c, selectable = false, i = 0) {
    return `
        <div class="card ${selectable ? "selectable" : ""}" data-index="${i}">
            ${
                c.image
                    ? `<img src="img/${esc(c.image)}" alt="${esc(c.nom)}" onerror="this.outerHTML='<div class=\\'placeholder\\'>Image</div>'">`
                    : '<div class="placeholder">Image</div>'
            }

            <h4>${esc(c.nom)}</h4>

            <div class="manga">
                ${esc(c.manga || "")}
            </div>

            <div class="stats">
                <div class="stat">
                    💪 <span>Force </span><b>${c.force}</b>
                </div>

                <div class="stat">
                    🧠 <span>Intelligence </span><b>${c.intelligence}</b>
                </div>

                <div class="stat">
                    ⚡ <span>Agilité </span><b>${c.agilite}</b>
                </div>

                <div class="stat">
                    ☠️ <span>Dangerosité </span><b>${c.dangerosite}</b>
                </div>
            </div>
        </div>
    `;
}

function updateTurn() {
    document.getElementById("turnTitle").textContent =
        attacker === "computer"
            ? "🤖 L'ordinateur attaque"
            : "👤 Tu attaques";
}

function showMessage(m) {
    document.getElementById("message").textContent = m;
}

function esc(s) {
    return String(s).replace(
        /[&<>"']/g,
        m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m])
    );
}

document.getElementById("newGame").onclick = startGame;

loadCards();

