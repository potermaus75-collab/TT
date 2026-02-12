export class CombatManager {
    constructor(player, dice, logger) {
        this.player = player;
        this.dice = dice;
        this.logger = logger;
        this.enemy = null;
        this.isBattle = false;
        this.combatInterval = null; // 자동 전투 타이머
        
        // DOM
        this.modal = document.getElementById('modal-combat');
        this.btnRoll = document.getElementById('btn-roll-dice');
        this.diceVisual = document.getElementById('dice-visual');
        this.diceMsg = document.getElementById('dice-message');
        this.combatLog = document.getElementById('combat-log-mini');
        
        this.btnRoll.onclick = () => this.rollStartDice();
        document.getElementById('btn-combat-run').onclick = () => this.tryRun();
    }

    startBattle(enemyData, endCallback) {
        this.enemy = JSON.parse(JSON.stringify(enemyData));
        this.isBattle = true;
        this.endCallback = endCallback;
        this.player.fightCount++;

        // UI 초기화
        this.modal.classList.remove('hidden');
        this.btnRoll.style.display = 'block'; // 버튼 보이기
        this.btnRoll.disabled = false;
        this.diceMsg.innerText = "전투 시작! 주사위를 굴려 운명을 정하세요.";
        this.diceMsg.style.color = "#ccc";
        this.diceVisual.innerText = "🎲";
        this.diceVisual.classList.remove('rolling');
        this.combatLog.innerHTML = "";
        
        this.updateCombatUI();
    }

    updateCombatUI() {
        // 적 정보
        document.getElementById('enemy-name').innerText = this.enemy.name;
        document.getElementById('enemy-hp-text').innerText = `HP ${this.enemy.hp}`;
        // 적 MaxHP 데이터가 없으므로 현재 HP가 깎이는 연출만
        // (제대로 하려면 DB에 maxHp 추가 필요, 지금은 임시로 100% 바 유지하다 색만 바꿀 수도 있음)
        document.getElementById('enemy-hp-bar').style.width = `100%`; 

        // 내 정보
        document.getElementById('combat-player-hp-text').innerText = `HP ${Math.floor(this.player.hp)}`;
        const ppct = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('combat-player-hp-bar').style.width = `${ppct}%`;
    }

    // 1단계: 주사위 굴리기 (스탯 보정 결정)
    rollStartDice() {
        this.btnRoll.disabled = true;
        this.diceVisual.classList.add('rolling');
        this.diceMsg.innerText = "운명을 굴리는 중...";

        setTimeout(() => {
            this.diceVisual.classList.remove('rolling');
            const roll = this.dice.roll();
            this.diceVisual.innerText = roll;

            // 주사위 결과에 따른 보정 (Buff/Debuff)
            let bonusMsg = "";
            let dmgMult = 1.0;
            
            if (roll === 20) {
                dmgMult = 1.5; bonusMsg = "🔥 [대성공] 공격력 50% 증가!";
                this.diceMsg.style.color = "#ff5555";
            } else if (roll >= 15) {
                dmgMult = 1.2; bonusMsg = "⚔️ [유리함] 공격력 20% 증가!";
                this.diceMsg.style.color = "#55ff55";
            } else if (roll <= 5) {
                dmgMult = 0.8; bonusMsg = "☁️ [불리함] 공격력 20% 감소...";
                this.diceMsg.style.color = "#888";
            } else if (roll === 1) {
                dmgMult = 0.5; bonusMsg = "💀 [대실패] 공격력 50% 감소!";
                this.diceMsg.style.color = "#555";
            } else {
                bonusMsg = "⚖️ [평범] 정상적인 컨디션입니다.";
                this.diceMsg.style.color = "#fff";
            }

            this.diceMsg.innerText = bonusMsg;
            
            // 2단계: 자동 전투 시작
            setTimeout(() => {
                this.btnRoll.style.display = 'none'; // 주사위 버튼 숨김
                this.startAutoCombat(dmgMult);
            }, 1000);

        }, 600);
    }

    // 2단계: 자동 전투 루프
    startAutoCombat(playerDmgMult) {
        this.log("⚔️ 자동 전투가 시작됩니다!");
        
        this.combatInterval = setInterval(() => {
            if (!this.isBattle) {
                clearInterval(this.combatInterval);
                return;
            }

            const pStats = this.player.getCombatStats();

            // 1. 플레이어 공격
            // 데미지 = (내 공격력 - 적 방어력/2) * 주사위보정
            let pDmg = Math.floor((pStats.atk - (this.enemy.def / 2)) * playerDmgMult);
            pDmg = Math.max(1, pDmg); // 최소 데미지 1

            // 크리티컬 확률 (운 스탯 영향)
            if (Math.random() * 100 < pStats.luk) {
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

            // 2. 적 공격
            // 데미지 = (적 공격력 - 내 방어력)
            let eDmg = Math.max(0, this.enemy.atk - pStats.def);
            const isDead = this.player.takeDamage(eDmg);
            this.updateCombatUI();

            if (eDmg > 0) this.log(`🛡️ ${eDmg}의 피해를 입었습니다.`);
            else this.log(`🛡️ 적의 공격을 막아냈습니다.`);

            if (isDead) {
                this.endBattle(false);
            }

        }, 800); // 0.8초마다 턴 진행
    }

    endBattle(win) {
        clearInterval(this.combatInterval); // 루프 정지
        this.isBattle = false;
        
        const resultMsg = win ? "🎉 승리!" : "💀 패배...";
        this.diceMsg.innerText = resultMsg;

        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.endCallback(win, this.enemy);
        }, 1500);
    }

    tryRun() {
        clearInterval(this.combatInterval);
        if (Math.random() > 0.5) {
            this.log("🏃💨 도망 성공!");
            this.isBattle = false;
            setTimeout(() => {
                this.modal.classList.add('hidden');
                this.endCallback(true, null); // true를 주되 enemy는 null (보상 없음)
            }, 1000);
        } else {
            this.log("❌ 도망 실패! 잡혔습니다.");
            if (!this.combatInterval) { 
                // 주사위 굴리기 전 도망 실패시 자동 전투 강제 시작 (패널티 없음)
                this.btnRoll.style.display = 'none';
                this.startAutoCombat(1.0);
            }
        }
    }

    log(msg) {
        const p = document.createElement('div');
        p.innerText = msg;
        this.combatLog.prepend(p);
    }
}
