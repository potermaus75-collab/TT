export class CombatManager {
    constructor(player, dice, logger) {
        this.player = player;
        this.dice = dice;
        this.logger = logger;
        this.enemy = null;
        this.isBattle = false;
        this.combatInterval = null; // 자동 전투용 타이머
        
        // DOM 요소 연결
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
        // [수정] 적 데이터 복사 및 최대 체력 설정 (UI 오류 방지)
        this.enemy = JSON.parse(JSON.stringify(enemyData));
        this.enemy.maxHp = this.enemy.hp; 

        this.isBattle = true;
        this.endCallback = endCallback;
        this.player.fightCount++;

        // UI 초기화
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
        // [수정] 적 HP 바 비율 계산 로직 추가
        document.getElementById('enemy-name').innerText = this.enemy.name;
        document.getElementById('enemy-hp-text').innerText = `HP ${this.enemy.hp}/${this.enemy.maxHp}`;
        
        const enemyPct = Math.max(0, (this.enemy.hp / this.enemy.maxHp) * 100);
        document.getElementById('enemy-hp-bar').style.width = `${enemyPct}%`;

        // 내 정보
        document.getElementById('combat-player-hp-text').innerText = `HP ${Math.floor(this.player.hp)}`;
        const ppct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        document.getElementById('combat-player-hp-bar').style.width = `${ppct}%`;
    }

    // 1단계: 주사위 굴리기
    rollStartDice() {
        this.btnRoll.disabled = true;
        this.diceVisual.classList.add('rolling');
        this.diceMsg.innerText = "운명 결정 중...";

        setTimeout(() => {
            this.diceVisual.classList.remove('rolling');
            const roll = this.dice.roll(); // 1~20
            this.diceVisual.innerText = roll;

            // 주사위 결과에 따른 보정
            let bonusMsg = "";
            let dmgMult = 1.0;
            
            if (roll === 20) {
                dmgMult = 1.5; bonusMsg = "🔥 [대성공] 공격력 1.5배!";
                this.diceMsg.style.color = "#ff5555";
            } else if (roll >= 15) {
                dmgMult = 1.2; bonusMsg = "⚔️ [유리함] 공격력 1.2배!";
                this.diceMsg.style.color = "#55ff55";
            } else if (roll <= 5) {
                dmgMult = 0.8; bonusMsg = "☁️ [불리함] 공격력 0.8배...";
                this.diceMsg.style.color = "#888";
            } else if (roll === 1) {
                dmgMult = 0.5; bonusMsg = "💀 [대실패] 공격력 반토막!";
                this.diceMsg.style.color = "#555";
            } else {
                bonusMsg = "⚖️ [평범] 정상 컨디션.";
                this.diceMsg.style.color = "#fff";
            }

            this.diceMsg.innerText = bonusMsg;
            
            // 2단계: 자동 전투 시작
            setTimeout(() => {
                this.btnRoll.style.display = 'none'; 
                this.startAutoCombat(dmgMult);
            }, 800);

        }, 500);
    }

    // 2단계: 자동 전투 루프
    startAutoCombat(playerDmgMult) {
        this.log("⚔️ 자동 전투 시작!");
        
        this.combatInterval = setInterval(() => {
            if (!this.isBattle) {
                clearInterval(this.combatInterval);
                return;
            }

            const pStats = this.player.getCombatStats();

            // --- 플레이어 턴 ---
            let pDmg = Math.floor((pStats.atk - (this.enemy.def / 2)) * playerDmgMult);
            pDmg = Math.max(1, pDmg); // 최소 1 데미지 보장

            // 치명타 (운 스탯)
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

            // --- 적 턴 ---
            // [수정] 방어력이 높아도 최소 1 데미지는 입도록 변경 (무적 버그 방지)
            let eDmg = Math.max(1, this.enemy.atk - pStats.def);
            const isDead = this.player.takeDamage(eDmg);
            this.updateCombatUI();

            this.log(`🛡️ ${eDmg} 피해를 입음.`);

            if (isDead) {
                this.endBattle(false);
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
        if (Math.random() > 0.5) {
            this.log("🏃💨 도망 성공!");
            this.isBattle = false;
            setTimeout(() => {
                this.modal.classList.add('hidden');
                this.endCallback(true, null); 
            }, 800);
        } else {
            this.log("❌ 도망 실패! 턴을 낭비했습니다.");
            // 실패 시 자동 전투 재개
            if (!this.combatInterval && this.btnRoll.style.display === 'none') {
                this.startAutoCombat(1.0);
            }
        }
    }

    log(msg) {
        const p = document.createElement('div');
        p.innerHTML = msg;
        this.combatLog.prepend(p);
    }
}
