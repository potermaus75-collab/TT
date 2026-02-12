export class CombatManager {
    constructor(player, dice, logger) {
        this.player = player;
        this.dice = dice;
        this.logger = logger;
        this.enemy = null;
        this.isBattle = false;
        
        // DOM 요소 캐싱
        this.modal = document.getElementById('modal-combat');
        this.btnRoll = document.getElementById('btn-roll-dice');
        this.diceVisual = document.getElementById('dice-visual');
        this.diceMsg = document.getElementById('dice-message');
        this.combatLog = document.getElementById('combat-log-mini');
        
        // 이벤트 연결
        this.btnRoll.onclick = () => this.rollDicePhase();
        document.getElementById('btn-combat-run').onclick = () => this.tryRun();
    }

    // 전투 시작 (모달 열기)
    startBattle(enemyData, endCallback) {
        this.enemy = JSON.parse(JSON.stringify(enemyData)); // 복사
        this.isBattle = true;
        this.endCallback = endCallback;
        this.player.fightCount++;

        // 모달 UI 초기화
        this.modal.classList.remove('hidden');
        this.btnRoll.disabled = false;
        this.diceMsg.innerText = "주사위를 굴려 선공을 정하세요!";
        this.combatLog.innerHTML = ""; // 로그 초기화
        
        this.updateCombatUI();
        this.log(`⚔️ ${this.enemy.name} (Lv.${this.enemy.lv}) 조우!`);
    }

    // 화면 갱신 (HP바 등)
    updateCombatUI() {
        // 적 정보
        document.getElementById('enemy-name').innerText = this.enemy.name;
        document.getElementById('enemy-hp-text').innerText = `HP ${this.enemy.hp}`;
        const enemyHpPct = Math.max(0, (this.enemy.hp / 100) * 100); // MaxHP 정보가 없으니 대충 100 기준..이 아니라 DB에 maxHp가 없네? 일단 현재 hp기준으로
        document.getElementById('enemy-hp-bar').style.width = `100%`; // 그냥 꽉 채우기 (데이터 부족)

        // 내 정보 (전투 모달 내)
        document.getElementById('combat-player-hp-text').innerText = `HP ${Math.floor(this.player.hp)}`;
        document.getElementById('combat-player-hp-bar').style.width = `${(this.player.hp / this.player.maxHp)*100}%`;
    }

    // 주사위 굴리기 액션
    rollDicePhase() {
        this.btnRoll.disabled = true;
        this.diceVisual.classList.add('rolling');
        this.diceMsg.innerText = "주사위 굴리는 중...";

        // 0.6초 뒤 결과
        setTimeout(() => {
            this.diceVisual.classList.remove('rolling');
            const roll = this.dice.roll(); // 1~20
            this.diceVisual.innerText = roll; // 숫자 보여주기

            this.resolveTurn(roll);
        }, 600);
    }

    // 턴 결과 계산
    resolveTurn(roll) {
        // 1. 플레이어 공격 (주사위 숫자에 따라 보정)
        let hitChance = roll;
        // 보정: 내 DEX vs 적 방어
        // (간단히: 10 이상이면 명중, 20은 크리, 1은 빗나감)
        
        if (roll === 1) {
            this.log(`❌ 대실패! 발이 미끄러졌습니다.`);
        } else if (roll >= 10) {
            // 데미지 계산
            let dmg = Math.max(1, this.player.stats.str - Math.floor(this.enemy.def / 2));
            if (roll === 20) {
                dmg *= 2; 
                this.log(`🔥 [CRITICAL] 급소 가격!`);
            }
            this.enemy.hp -= dmg;
            this.log(`🗡️ 당신의 공격! ${dmg} 피해.`);
        } else {
            this.log(`💨 공격이 빗나갔습니다.`);
        }

        // 적 사망 체크
        if (this.enemy.hp <= 0) {
            this.endBattle(true);
            return;
        }

        // 2. 적의 반격 (잠시 후)
        setTimeout(() => {
            this.enemyAttack();
        }, 800);
    }

    enemyAttack() {
        const dmg = Math.max(0, this.enemy.atk - Math.floor(this.player.stats.dex / 3)); // 대충 방어 공식
        const isDead = this.player.takeDamage(dmg);
        this.log(`🛡️ 적의 반격! ${dmg} 피해를 입었습니다.`);
        this.updateCombatUI();

        if (isDead) {
            this.endBattle(false);
        } else {
            // 다시 플레이어 턴
            this.btnRoll.disabled = false;
            this.diceMsg.innerText = "당신의 차례입니다.";
        }
    }

    endBattle(win) {
        setTimeout(() => {
            this.modal.classList.add('hidden'); // 모달 닫기
            this.isBattle = false;
            this.endCallback(win, this.enemy);
        }, 1500);
    }

    tryRun() {
        if(Math.random() > 0.5) {
            this.log("🏃 도망 성공!");
            this.endBattle(true); // 도망은 승리는 아니지만 생존
        } else {
            this.log("잡혔습니다!");
            this.enemyAttack();
        }
    }

    log(msg) {
        const p = document.createElement('div');
        p.innerText = msg;
        this.combatLog.prepend(p); // 최신 로그가 위로
    }
}
