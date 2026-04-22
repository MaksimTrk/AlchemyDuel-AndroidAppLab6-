// Ім'я встановлюється дефолтно; Android-міст оновить його через
// evaluateJavascript після завантаження сторінки (onPageFinished).
const state = {
    playerName: 'Alchemist',
    playerHP: 100,
    enemyHP: 100,
    enemyMaxHP: 100,
    currentEnemyIndex: 0,
    deck: ['fire', 'water', 'water', 'root', 'mercury', 'fire', 'root'],
    hand: [],
    selected: [],
    effects: {
        shield: 0,
        poison: 0,
        fire: 0
    },
    isPlayerTurn: true
};

const ENEMIES = [
    { 
        name: "Goblin", 
        hp: 100, 
        asset: 'assets/goblin.png', 
        attackAsset: 'assets/goblin_attack.png',
        background: 'assets/forest_bg.png',
        attackSound: "goblin_atack",
        ability: null, 
        chance: 0
    },
    { 
        name: "Swamp Wizard", 
        hp: 100, 
        asset: 'assets/swamp_wizard.png', 
        attackAsset: 'assets/swamp_wizard_attack.png',
        background: 'assets/swamp_bg.png',
        attackSound: "swamp_wizard_atack",
        ability: ["vampirism"], 
        chance: 0.2
    },
    { 
        name: "Swamp Ghost", 
        hp: 150, 
        asset: 'assets/swamp_ghost.png', 
        attackAsset: 'assets/swamp_ghost_attack.png',
        background: 'assets/swamp_ghost_bg.png',
        attackSound: "swamp_ghost_atack",
        ability: ["dodge"], 
        chance: 0.25
    },
    { 
        name: "Cursed Bride", 
        hp: 130, 
        asset: 'assets/bride.png', 
        attackAsset: 'assets/bride_attack.png',
        reflectAsset: 'assets/bride_reflect.png', 
        background: 'assets/cathedral_bg.png',
        attackSound: "bride_atack",
        ability: ["reflect"], 
        chance: 0.4 
    },
    { 
        name: "Cursed Witch & Rat", 
        hp: 200, 
        maxHp: 200,
        asset: 'assets/witch.png', 
        attackAsset: 'assets/witch_attack.png',
        protectedAsset: 'assets/witch_protected.png',
        size: "150px",
        background: 'assets/cathedral_interior.png',
        attackSound: "witch_atack",
        ability: ["summon"],
        minion: {
            name: "Plague Rat",
            hp: 50,
            maxHp: 50,
            asset: 'assets/rat.png',
            attackAsset: 'assets/rat_attack.png',
            attackSound: "rat_atack",
            size: "95px",
            alive: true
        }
    },
    { 
        name: "Grendel", 
        hp: 140, 
        asset: 'assets/grendel.png', 
        attackAsset: 'assets/grendel_attack.png',
        background: 'assets/grendel_bg.png',
        attackSound: "grendel_atack",
    },
    { 
        name: "Bat Swarm", 
        hp: 80, 
        asset: 'assets/bats.png', 
        attackAsset: 'assets/bats_attack.png',
        background: 'assets/bat_bg.png',
        attackSound: "bats_atack",
        ability: ["multi-attack", "vampirism"],
        hits: 3, 
        chance: 0.7
    },
    { 
        name: "Redmaw", 
        hp: 120, 
        asset: 'assets/redmaw.png', 
        attackAsset: 'assets/redmaw_attack.png',
        background: 'assets/redmaw_bg.jpg',
        attackSound: "redmaw_atack",
        ability: ["poison"],
        hits: 3, 
        chance: 0.4
    },
    {
        name: "The Fire Acolyte",
        hp: 80,
        asset: 'assets/acolyte.png',
        attackAsset: 'assets/acolyte_attack.png',
        background: 'assets/acolyte_bg.png',
        attackSound: "acolyte_atack",
        ability: ["fire"],
        chance: 0.4
    },
    {
        name: "Dragon",
        hp: 250,
        asset: 'assets/dragon.png',
        attackAsset: 'assets/dragon_attack.png',
        background: 'assets/dragon_bg.png',
        attackSound: "dragon_atack",
        ability: ["fire"],
        chance: 0.2
    }
];

const ASSETS = {
    // Інгредієнти
    fire: 'assets/fire.png',
    water: 'assets/water.png',
    root: 'assets/root.png',
    mercury: 'assets/mercury.png',
    
    // Гравець
    playerDefault: 'assets/wizard.png',
    playerAttack: 'assets/wizard_attack.png',
    playerHeal: 'assets/wizard_heal.png',
};

const RECIPES = {
    "fire,fire": { name: "Fireball", damage: 25, heal: 0, msg: "Huge explosion!" },
    "water,water": { name: "Pure Water", damage: 0, heal: 5, msg: "Refreshing." },
    "root,water": { name: "Healing Brew", damage: 0, heal: 20, msg: "You feel better." },
    "fire,mercury": { name: "Acid Cloud", damage: 15, heal: 0, msg: "Enemy is dissolving!" },
    "fire,water": { name: "Steam Blast", damage: 8, heal: 0, msg: "Hot steam burns the enemy." },
    "root,root": { name: "Ironwood Shield", damage: 0, heal: 12, msg: "Your defense is stronger." },
    "mercury,root": { name: "Toxic Thorn", damage: 18, heal: 0, msg: "Nature and poison combine." }
};

const handContainer = document.getElementById('hand');
const slot1 = document.getElementById('slot-1');
const slot2 = document.getElementById('slot-2');
const log = document.getElementById('log');
const restartContainer = document.getElementById('restart-container');
let backgroundMusic = null;
// 1. Початок гри
function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    // Тут можна запустити музику, якщо вона ще не грає
    startBackgroundMusic();
}

// 2. Зміна імені
function changeName() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('player-name-input');
    
    modal.classList.add('show');
    input.value = state.playerName; // Попередньо вписуємо поточне ім'я
    input.focus();
}
function closeNameModal() {
    document.getElementById('name-modal').classList.remove('show');
}
function saveName() {
    const input = document.getElementById('player-name-input');
    const newName = input.value.trim();

    if (newName.length > 0) {
        state.playerName = newName;

        // ── Зберігаємо ім'я через Android SharedPreferences ──
        if (typeof Android !== 'undefined') {
            Android.saveName(state.playerName);
        }

        updateUI();
        console.log("Name changed to:", state.playerName);
        closeNameModal();
    } else {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
    }
}
document.getElementById('player-name-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        saveName();
    }
});

// 3. Робота з вікном About
function showAbout() {
    document.getElementById('about-modal').classList.add('show');
}

function closeAbout() {
    document.getElementById('about-modal').classList.remove('show');
}
function startBackgroundMusic() {
    if (backgroundMusic) return;

    // Якщо запущено на Android — делегуємо MediaPlayer через міст
    if (typeof Android !== 'undefined') {
        Android.startMusic();
        backgroundMusic = true; // sentinel, щоб не запускати повторно
        return;
    }

    // Fallback для браузера (тестування на ПК)
    backgroundMusic = new Audio('assets/sounds/background.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.2;
    backgroundMusic.play().catch(e => console.log("Music wait for interaction"));
}


document.addEventListener('click', startBackgroundMusic, { once: true });
function refillHand() {
    while (state.hand.length < 5) {
        const randomIngredient = state.deck[Math.floor(Math.random() * state.deck.length)];
        state.hand.push(randomIngredient);
    }
    renderHand();
}

function renderHand() {
    handContainer.innerHTML = '';
    state.hand.forEach((id, index) => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <img src="${ASSETS[id]}" alt="${id}">
            <div class="card-label">${id}</div>
        `;
        card.onclick = () => selectIngredient(index);
        handContainer.appendChild(card);
    });
}

function selectIngredient(index) {
    if (!state.isPlayerTurn) return; 

    if (state.selected.length < 2) {
        const id = state.hand[index];
        state.selected.push(id);
        state.hand.splice(index, 1);
        
        updateSlots();
        renderHand();

        if (state.selected.length === 2) {
            state.isPlayerTurn = false; 
            updateUI(); 
            setTimeout(checkCombo, 600);
        }
    }
}
function toggleRecipeBook() {
    const book = document.getElementById('recipe-book');
    if (!book) return;
    
    book.classList.toggle('hidden');

    if (!book.classList.contains('hidden')) {
        renderRecipes();
    }
}

function renderRecipes() {
    const list = document.getElementById('recipes-list');
    list.innerHTML = '';

    for (const [ingredients, data] of Object.entries(RECIPES)) {
        const entry = document.createElement('div');
        entry.className = 'recipe-entry';

        const ingredientIcons = ingredients.split(',').join(' + ');

        entry.innerHTML = `
            <div><small>${ingredientIcons}</small></div>
            <div><b>${data.name}</b></div>
            <div style="font-size: 0.85rem; opacity: 0.8;">${data.msg}</div>
            <div style="font-size: 0.8rem; margin-top: 4px;">
                ${data.damage > 0 ? '⚔️ Damage: ' + data.damage : ''}
                ${data.heal > 0 ? '💚 Heal: ' + data.heal : ''}
            </div>
        `;
        list.appendChild(entry);
    }
}
function updateSlots() {
    const s1 = state.selected[0];
    const s2 = state.selected[1];

    slot1.innerHTML = s1 ? `<img src="${ASSETS[s1]}" style="width:70%;"><div class="card-label">${s1}</div>` : '?';
    slot2.innerHTML = s2 ? `<img src="${ASSETS[s2]}" style="width:70%;"><div class="card-label">${s2}</div>` : '?';
}
function triggerAction(entity, type) {
    const elementId = entity === 'player' ? 'player-sprite' : 'enemy-sprite';
    const container = document.getElementById(elementId);
    const img = container.querySelector('img');
    const currentEnemy = ENEMIES[state.currentEnemyIndex];

    let newSrc;
    if (entity === 'player') {
        newSrc = type === 'attack' ? ASSETS.playerAttack : ASSETS.playerHeal;
    } else {
        newSrc = currentEnemy.attackAsset; 
    }
    
    img.src = newSrc;
    container.classList.add('action-pulse');
    setTimeout(() => {
        img.src = entity === 'player' ? ASSETS.playerDefault : currentEnemy.asset;
        container.classList.remove('action-pulse');
    }, 1200);
}
function loadEnemy(index) {
    const enemy = ENEMIES[index];
    const minionArea = document.getElementById('minion-container');
    state.enemyHP = enemy.hp;
    state.enemyMaxHP = enemy.hp;

    const gameContainer = document.getElementById('game-container');
    
    // Міньйон
    if (enemy.minion) {
        minionArea.style.display = 'block';
        document.getElementById('minion-name').innerText = enemy.minion.name;

        const minionSize = enemy.minion.size || "60px"; 
        document.getElementById('minion-sprite').innerHTML = 
            `<img src="${enemy.minion.asset}" style="width:${minionSize};">`;
    } else {
        minionArea.style.display = 'none';
    }

    if (enemy.background) {
        gameContainer.style.backgroundImage = `url('${enemy.background}')`;
    }

    const enemySprite = document.getElementById('enemy-sprite');
    const displaySize = enemy.size || "120px"; 
    enemySprite.innerHTML = `<img src="${enemy.asset}" style="width:${displaySize};">`;
    
    log.innerText = `A wild ${enemy.name} appears!`;
    updateUI();
}
function setupSprites() {
    const playerSprite = document.getElementById('player-sprite');
    playerSprite.innerHTML = `<img src="${ASSETS.playerDefault}" style="width:120px;">`;
    loadEnemy(state.currentEnemyIndex); 
}

setupSprites();

function checkCombo() {
    const combo = [...state.selected].sort().join(',');
    console.log("Checking combo for:", combo); 
    
    const result = RECIPES[combo];

    if (result) {
        applyEffect(result);
    } else {
        playSound('fail');
        log.innerText = "Failure! The potion exploded (5 damage to self)";
        state.playerHP -= 5;
    }

    state.selected = [];
    updateSlots();
    refillHand();
    updateUI();
    
    setTimeout(() => {
            if (!checkDeath()) {
                enemyTurn();
            }
    }, 1300);
}

function applyEffect(effect) {
    const enemy = ENEMIES[state.currentEnemyIndex];
    let message = `You crafted ${effect.name}! ${effect.msg}`;
    
    // Створюємо масив здібностей для безпечної перевірки
    const abilities = Array.isArray(enemy.ability) ? enemy.ability : (enemy.ability ? [enemy.ability] : []);

    if (effect.name === "Ironwood Shield") {
        state.effects.shield = 1; 
        message = "You are protected by ironwood!";
    }

    if (effect.damage > 0) {
        let finalDamage = effect.damage;

        // 1. СУПРОТИВ ДО ВОГНЮ
        const isFireAttack = effect.name.includes("Fire") || effect.name.includes("Steam");
        if (isFireAttack && abilities.includes("fire")) {
            finalDamage = Math.floor(finalDamage * 0.5); 
            message = `The ${enemy.name} is resistant to fire! ${effect.name} dealt only ${finalDamage} damage.`;
        }

        // 2. УКЛОНЕННЯ (DODGE)
        if (abilities.includes("dodge") && Math.random() < enemy.chance) {
            playSound('damage_dodge');
            log.innerText = `${enemy.name} dodged your attack!`;
            updateUI(); 
            return; // Виходимо з функції, атака не вдалася
        }

        // 3. ВІДБИТТЯ (REFLECT)
        if (abilities.includes("reflect") && Math.random() < enemy.chance) {
            const reflectedDamage = Math.floor(finalDamage * 0.5); 
            state.playerHP -= reflectedDamage;
            
            const enemyContainer = document.getElementById('enemy-sprite');
            enemyContainer.classList.add('reflect-shake');
            setTimeout(() => enemyContainer.classList.remove('reflect-shake'), 500);

            const enemyImg = document.querySelector('#enemy-sprite img');
            if (enemy.reflectAsset) enemyImg.src = enemy.reflectAsset;
            
            playSound('bride_reflect'); 
            message = `${enemy.name} reflects the attack! You took ${reflectedDamage} damage!`;

            setTimeout(() => { enemyImg.src = enemy.asset; }, 1000);
            
            // Якщо хочете, щоб ворог НЕ отримував урон при відбитті, додайте тут return
        }

        // 4. НАНЕСЕННЯ УРОНУ (МІНЬЙОН АБО ВОРОГ)
        if (enemy.minion && enemy.minion.hp > 0) {
            enemy.minion.hp -= finalDamage;
            message = `The ${enemy.minion.name} protects the Witch! (-${finalDamage} HP)`;

            // Візуальний ефект захисту
            const enemyImg = document.querySelector('#enemy-sprite img');
            if (enemyImg && enemy.protectedAsset) {
                enemyImg.src = enemy.protectedAsset; 
                setTimeout(() => { if (state.enemyHP > 0) enemyImg.src = enemy.asset; }, 800);
            }

            if (enemy.minion.hp <= 0) {
                enemy.minion.hp = 0;
                message = `The ${enemy.minion.name} is defeated! Witch is now vulnerable!`;
            }
        } else {
            state.enemyHP -= finalDamage;
        }

        playSound('wizard_atack');
        triggerAction('player', 'attack');
    }

    if (effect.heal > 0) {
        playSound('wizard_heal');
        triggerAction('player', 'heal');
        state.playerHP += effect.heal;
        
        if (effect.name === "Pure Water" && state.effects.fire > 0) {
            state.effects.fire = 0;
            message = "Pure Water extinguished the flames!";
        }
        
        if (effect.name === "Healing Brew" && state.effects.poison > 0) {
            state.effects.poison = 0;
            message = "The brew neutralized the poison!";
        }
    }

    if (state.playerHP > 100) state.playerHP = 100;

    log.innerText = message;
    updateUI();
}

function updateUI() {
    document.getElementById('player-hp-fill').style.width = Math.max(0, state.playerHP) + '%';
    document.getElementById('player-hp-text').innerText = `${state.playerHP}/100`;
    const pNameLabel = document.getElementById('player-name-label');
    if (pNameLabel) pNameLabel.innerText = state.playerName;
    const enemyPercentage = (state.enemyHP / state.enemyMaxHP) * 100;
    document.getElementById('enemy-hp-fill').style.width = Math.max(0, enemyPercentage) + '%';
    document.getElementById('enemy-hp-text').innerText = `${state.enemyHP}/${state.enemyMaxHP}`;
    const enemy = ENEMIES[state.currentEnemyIndex];

    document.getElementById('enemy-name-label').innerText = enemy.name;
    if (enemy.minion) {
        const minionPercent = (enemy.minion.hp / enemy.minion.maxHp) * 100;
        document.getElementById('minion-hp-fill').style.width = Math.max(0, minionPercent) + '%';

        document.getElementById('minion-sprite').style.opacity = enemy.minion.hp <= 0 ? '0.3' : '1';
    }
  
    const effectsContainer = document.getElementById('player-effects');
    effectsContainer.innerHTML = ''; 

    if (state.effects.shield > 0) {
        const shieldWrapper = document.createElement('div');
        shieldWrapper.style.position = 'relative';
        shieldWrapper.style.display = 'inline-block';

        // Іконка
        shieldWrapper.innerHTML = `
            <span style="font-size: 24px;">🛡️</span>
            <b style="
                position: absolute; 
                bottom: -5px; 
                right: -5px; 
                background: white; 
                border-radius: 50%; 
                padding: 2px 5px; 
                font-size: 10px; 
                color: black;
                border: 1px solid green;
            ">${state.effects.shield}</b>
        `;
        
        effectsContainer.appendChild(shieldWrapper);
    }
    if (state.effects.poison > 0) {
        const poisonWrapper = document.createElement('div');
        poisonWrapper.style.display = 'inline-block';
        poisonWrapper.innerHTML = `
            <span style="font-size: 24px; filter: drop-shadow(0 0 5px green);">🧪</span>
            <b style="color: green;">${state.effects.poison}</b>
        `;
        effectsContainer.appendChild(poisonWrapper);
    }
    if (state.effects.fire > 0) {
        const fireWrapper = document.createElement('div');
        fireWrapper.style.display = 'inline-block';
        fireWrapper.innerHTML = `
            <span style="font-size: 24px; filter: drop-shadow(0 0 5px orange);">🔥</span>
            <b style="color: orange;">${state.effects.fire}</b>
        `;
        effectsContainer.appendChild(fireWrapper);
    }
    const handContainer = document.getElementById('hand');
    if (state.isPlayerTurn) {
        handContainer.style.opacity = "1";
        handContainer.style.pointerEvents = "auto";
    } else {
        handContainer.style.opacity = "0.5";
        handContainer.style.pointerEvents = "none"; 
    }
}
function checkDeath() {
   if (state.enemyHP <= 0) {
        state.enemyHP = 0; 
        updateUI();

        const healAmount = Math.floor(state.playerHP * 0.5);
        state.playerHP = Math.min(100, state.playerHP + healAmount);
        
        playSound('wizard_heal');
        log.innerText = `Enemy defeated! Restoring ${healAmount} HP.`;

        if (state.currentEnemyIndex < ENEMIES.length - 1) {
            state.currentEnemyIndex++;

            setTimeout(() => {
                loadEnemy(state.currentEnemyIndex);
                state.isPlayerTurn = true; 
                log.innerText += " Your turn!";
                updateUI();
            }, 2000);
        } else {
            log.innerText = "VICTORY! All enemies defeated!";
            endGame();
        }
        return true; 
    }

    if (state.playerHP <= 0) {
        state.playerHP = 0;
        updateUI();
        log.innerText = "GAME OVER...";
        endGame();
        return true;
    }
    return false;
}
function enemyTurn() {
    log.innerText += " ...Enemy is preparing...";
    
    setTimeout(() => {
        if (state.enemyHP <= 0) return;
        const currentEnemy = ENEMIES[state.currentEnemyIndex];
        let totalDamageDealt = 0;

        // Перетворюємо абілку на масив, якщо це null або рядок, щоб .includes не ламався
        const abilities = Array.isArray(currentEnemy.ability) ? currentEnemy.ability : (currentEnemy.ability ? [currentEnemy.ability] : []);

        // 1. ЛОГІКА МУЛЬТИ-АТАКИ (Кажани)
        if (abilities.includes("multi-attack")) {
            const hits = currentEnemy.hits || 3;
            for (let i = 0; i < hits; i++) {
                let strike = Math.floor(Math.random() * 8) + 1; // 1-8 урону
                
                if (state.effects.shield > 0) strike = Math.floor(strike * 0.3);
                totalDamageDealt += strike;

                setTimeout(() => {
                    triggerAction('enemy', 'attack');
                    if (currentEnemy.attackSound) playSound(currentEnemy.attackSound);
                }, i * 250); 
            }
            if (state.effects.shield > 0) state.effects.shield -= 1;
            log.innerText = `${currentEnemy.name} swarmed you!`;
        } 
        // 2. ЗВИЧАЙНА АТАКА (Гоблін та інші)
        else {
            totalDamageDealt = Math.floor(Math.random() * 9) + 8; // 8-16 урону
            if (state.effects.shield > 0) {
                totalDamageDealt = Math.floor(totalDamageDealt * 0.3);
                state.effects.shield -= 1;
            }
            triggerAction('enemy', 'attack');
            if (currentEnemy.attackSound) playSound(currentEnemy.attackSound);
            log.innerText = `${currentEnemy.name} attacks!`;
        }

        // 3. МІНЬЙОНИ
        if (currentEnemy.minion && currentEnemy.minion.hp > 0) {
            let mDmg = Math.floor(Math.random() * 5) + 3;
            totalDamageDealt += mDmg;
            const minionImg = document.querySelector('#minion-sprite img');
            if (minionImg && currentEnemy.minion.attackAsset) {
                minionImg.src = currentEnemy.minion.attackAsset;
                setTimeout(() => { minionImg.src = currentEnemy.minion.asset; }, 800);
            }
        }

        // 4. ВАМПІРИЗМ (тепер працює з масивом)
       if (abilities.includes("vampirism") && Math.random() < currentEnemy.chance) {
            const heal = Math.floor(totalDamageDealt * 0.5);
            state.enemyHP = Math.min(state.enemyMaxHP, state.enemyHP + heal);
            log.innerText += ` Vampirism! +${heal} HP.`;
        }

        // ПРАВИЛЬНА ПЕРЕВІРКА ОТРУЄННЯ (використовуємо зміну abilities)
        if (abilities.includes("poison")) {
            if (Math.random() < (currentEnemy.chance ?? 0.4)) {
                state.effects.poison = 2; 
                log.innerText += " You are poisoned! (2 turns)";
            }
        }

        if (abilities.includes("fire")) {
            if (state.effects.fire == 0 && Math.random() < (currentEnemy.chance ?? 0.2)) {
                state.effects.fire = 3; 
                log.innerText += " You are burning! (3 turns)";
            }
        }

        // 5. НАНЕСЕННЯ УРОНУ ТА ПЕРЕДАЧА ХОДУ
        state.playerHP -= totalDamageDealt;
        log.innerText += ` Total damage: ${totalDamageDealt}`;

        refillHand();
        updateUI();

        if (!checkDeath()) {
            state.isPlayerTurn = true;

            // Ефект отрути спрацьовує прямо зараз
            if (state.effects.poison > 0) {
                let poisonDmg = Math.floor(Math.random() * 4) + 2; // 2-5 HP
                state.playerHP -= poisonDmg;
                state.effects.poison -= 1;
                log.innerText += ` [Poison damage: -${poisonDmg} HP]`;
                
                updateUI(); 
                if (checkDeath()) return; 
            }
            if (state.effects.fire > 0) {
                let fireDmg = 6; 
                state.playerHP -= fireDmg;
                state.effects.fire -= 1;
                log.innerText += ` [Fire: -${fireDmg} HP]`;
            }

            log.innerText += " Your turn!";
            updateUI();
        }
    }, 1200);
}

function endGame() {
    handContainer.style.pointerEvents = 'none';
    handContainer.style.opacity = '0.5';
    restartContainer.style.display = 'block';
}

function resetGame() {
    state.playerHP = 100;
    state.enemyHP = 100;
    state.currentEnemyIndex = 0;
    state.hand = [];
    state.selected = [];
    state.effects.shield = 0; 
    state.isPlayerTurn = true;
    
    restartContainer.style.display = 'none';
    handContainer.style.pointerEvents = 'all';
    handContainer.style.opacity = '1';
    log.innerText = "Prepare for duel! Choose 2 ingredients.";
    
    slot1.innerText = '?';
    slot2.innerText = '?';
    
    refillHand();
    updateUI();
}
function playSound(name) {
    // Якщо запущено на Android — делегуємо нативному MediaPlayer
    if (typeof Android !== 'undefined') {
        Android.playSound(name);
        return;
    }
    // Fallback для браузера (тестування на ПК)
    const audio = new Audio(`assets/sounds/${name}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Sound error:", e));
}
refillHand();
updateUI();

window.onclick = function(event) {
    const bookModal = document.getElementById('recipe-book');
    if (event.target == bookModal) {
        toggleRecipeBook();
    }
}
function endPrologue() {
    const prologue = document.getElementById('prologue-container');
    const video = document.getElementById('prologue-video');

    // Плавне зникнення
    prologue.style.transition = 'opacity 1s ease';
    prologue.style.opacity = '0';

    setTimeout(() => {
        prologue.style.display = 'none';
        
        // Зупиняємо відео (перезавантажуємо iframe порожнім, щоб звук зник)
        video.src = ""; 
        
        // Показуємо головне меню
        document.getElementById('main-menu').style.display = 'flex';
    }, 1000);
}

