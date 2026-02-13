export class CombatManager {
    constructor(player, dice, logger) {
        this.player = player;
        this.dice = dice;
        this.logger = logger;
        this.enemy = null;
        this.isBattle = false;
        this.combatInterval = null;
        
        this.modal = document.getElementById('modal-combat');
        this.btnRoll = document.getElementById('btn-roll-dice');
        this.diceVisual = document.getElementById('dice-visual');
        this.diceMsg = document.getElementById('dice-message');
        this.combatLog = document.getElementById('combat-log-mini');
        
        if(this.btnRoll) this.btnRoll.onclick = () => this.rollStartDice();
        const btnRun = document.getElementById('btn-combat-run');
        if(btnRun) btnRun.onclick = () => this.tryRun();
    }

    startBattle(enemyData, endCallback) {
        this.enemy = JSON.parse(JSON.stringify(enemyData));
        this.enemy.maxHp = this.enemy.hp; 

        this.isBattle = true;
        this.endCallback = endCallback;
        this.player.fightCount++;

        this.modal.classList.remove('hidden');
        this.btnRoll.style.display = 'block'; 
        this.btnRoll.disabled = false;
        
        this.diceMsg.innerText = "전투 개시! 운명을 굴리세요.";
        this.diceMsg.style.color = "#ccc";
        this.diceVisual.innerText = "🎲";
        this.diceVisual.classList.remove('rolling');
        this.combatLog.innerHTML = "";
        
        this.updateCombatUI();
    }

    updateCombatUI() {
        document.getElementById('enemy-name').innerText = this.enemy.name;
        document.getElementById('enemy-hp-text').innerText = `HP ${this.enemy.hp}/${this.enemy.maxHp}`;
        
        const enemyPct = Math.max(0, (this.enemy.hp / this.enemy.maxHp) * 100);
        document.getElementById('enemy-hp-bar').style.width = `${enemyPct}%`;

        document.getElementById('combat-player-hp-text').innerText = `HP ${Math.floor(this.player.hp)}`;
        const pStats = this.player.getCombatStats();
        const ppct = Math.max(0, (this.player.hp / pStats.maxHp) * 100);
        document.getElementById('combat-player-hp-bar').style.width = `${ppct}%`;
    }

    rollStartDice() {
        this.btnRoll.disabled = true;
        this.diceVisual.classList.add('rolling');
        this.diceMsg.innerText = "운명 결정 중...";

        setTimeout(() => {
            this.diceVisual.classList.remove('rolling');
            const roll = this.dice.roll(); 
            this.diceVisual.innerText = roll;

            let bonusMsg = "";
            let dmgMult = 1.0;
            
            if (roll === 20) {
                dmgMult = 1.5; bonusMsg = "🔥 [대성공] 데미지 1.5배!";
                this.diceMsg.style.color = "#ff5555";
            } else if (roll === 1) {
                dmgMult = 0.5; bonusMsg = "💀 [대실패] 데미지 반토막!";
                this.diceMsg.style.color = "#555";
            } else if (roll >= 15) {
                dmgMult = 1.2; bonusMsg = "⚔️ [유리함] 데미지 1.2배!";
                this.diceMsg.style.color = "#55ff55";
            } else if (roll <= 5) {
                dmgMult = 0.8; bonusMsg = "☁️ [불리함] 데미지 0.8배...";
                this.diceMsg.style.color = "#888";
            } else {
                bonusMsg = "⚖️ [평범] 정상 컨디션.";
                this.diceMsg.style.color = "#fff";
            }

            this.diceMsg.innerText = bonusMsg;
            
            setTimeout(() => {
                this.btnRoll.style.display = 'none'; 
                this.startAutoCombat(dmgMult);
            }, 800);

        }, 500);
    }

    startAutoCombat(playerDmgMult) {
        this.log("⚔️ 자동 전투 시작!");
        
        this.combatInterval = setInterval(() => {
            if (!this.isBattle) {
                clearInterval(this.combatInterval);
                return;
            }

            const pStats = this.player.getCombatStats();
            const isMagic = this.player.isMagicWeapon();

            // --- 플레이어 턴 ---
            // 1. 공격 스탯 결정 (마법 무기면 지능, 아니면 힘)
            let baseAtk = isMagic ? pStats.int : pStats.str;
            
            // 2. 무기 공격력 합산 (getCombatStats의 atk에는 이미 str이 반영되어 있으므로, 
            //    여기서는 정확한 계산을 위해 무기+스탯을 재조합하거나 단순화해야 함)
            //    -> 편의상 getCombatStats().atk (무기+STR) 구조를 따르되, 
            //    -> 마법 무기일 경우 STR 대신 INT로 보정한다고 가정
            let finalAtk = pStats.atk; 
            if (isMagic) {
                // 기존 atk에 포함된 str을 빼고 int를 더하는 보정
                finalAtk = (pStats.atk - pStats.str) + pStats.int;
            }

            // 3. 방어력 차감 (적은 DEF 있음)
            let pDmg = Math.floor((finalAtk - (this.enemy.def / 2)) * playerDmgMult);
            pDmg = Math.max(1, pDmg); 

            // 4. 치명타 (DEX 기반)
            if (Math.random() * 100 < pStats.critChance) {
                pDmg = Math.floor(pDmg * 1.5);
                this.log(`💥 치명타! ${this.enemy.name}에게 ${pDmg} 피해`);
            } else {
                this.log(`🗡️ ${this.enemy.name}에게 ${pDmg} 피해`);
            }

            this.enemy.hp -= pDmg;
            this.updateCombatUI();

            if (this.enemy.hp <= 0) {
                this.endBattle(true);
                return;
            }

            // --- 적 턴 ---
            // 1. 회피 판정 (DEX 기반)
            if (Math.random() * 100 < pStats.evasion) {
                this.log(`💨 ${this.enemy.name}의 공격을 회피했습니다!`);
            } else {
                // 2. 방어력 적용 (오직 장비 방어력만 적용)
                let eDmg = Math.max(1, this.enemy.atk - pStats.def);
                const isDead = this.player.takeDamage(eDmg);
                this.updateCombatUI();

                this.log(`🛡️ ${eDmg} 피해를 입음.`);

                if (isDead) {
                    this.endBattle(false);
                }
            }

        }, 800);
    }

    endBattle(win) {
        clearInterval(this.combatInterval); 
        this.isBattle = false;
        
        const resultMsg = win ? "🎉 승리!" : "💀 패배...";
        this.diceMsg.innerText = resultMsg;

        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.endCallback(win, this.enemy);
        }, 1200);
    }

    tryRun() {
        clearInterval(this.combatInterval);
        // 도주 확률은 민첩에 비례 (기본 50% + DEX%)
        const escapeChance = Math.min(95, 50 + this.player.getCombatStats().dex);
        
        if (Math.random() * 100 < escapeChance) {
            this.log("🏃💨 도망 성공!");
            this.isBattle = false;
            setTimeout(() => {
                this.modal.classList.add('hidden');
                this.endCallback(true, null); 
            }, 800);
        } else {
            this.log("❌ 도망 실패! 턴을 낭비했습니다.");
            if (!this.combatInterval && this.btnRoll.style.display === 'none') {
                this.startAutoCombat(1.0);
            }
        }
    }

    log(msg) {
        const p = document.createElement('div');
        p.textContent = msg;
        this.combatLog.prepend(p);
    }
}
