export class CombatManager {
    constructor(player, dice, logger) {
        this.player = player;
        this.dice = dice;
        this.logger = logger;
        this.currentEnemy = null;
        this.isBattleActive = false;
        
        // 전투 턴 처리를 위한 콜백 (Main에서 받음)
        this.onBattleEnd = null; 
    }

    /**
     * 전투 시작
     */
    startBattle(enemyData, endCallback) {
        // 적 데이터 깊은 복사 (전투 중 HP 깎아야 하므로)
        this.currentEnemy = JSON.parse(JSON.stringify(enemyData));
        this.isBattleActive = true;
        this.onBattleEnd = endCallback;

        this.logger.add(`⚔️ <b>${this.currentEnemy.name}</b>(Lv.${this.currentEnemy.lv})가 나타났다!`, 'event');
        this.logger.add(`[전투 시작] 적의 체력: ${this.currentEnemy.hp}, 공격력: ${this.currentEnemy.atk}`);
    }

    /**
     * 플레이어의 공격 턴
     */
    playerAttack() {
        if (!this.isBattleActive) return;

        // 1. 명중 판정 (내 DEX vs 적 회피/방어)
        // 적에게 별도 회피 스탯이 없으면 기본 방어력(def) 활용
        // DEX가 적 방어력보다 5 높으면 'advantage'
        const checkType = this.dice.compareStats(this.player.stats.dex, this.currentEnemy.def);
        const hitRoll = this.dice.rollCheck(checkType);

        this.logger.add(`주사위 굴림: ${hitRoll.total} ${hitRoll.type !== 'normal' ? '(' + hitRoll.type + ')' : ''}`);

        // 대실패 (Fumble)
        if (hitRoll.isFumble) {
            this.logger.add(`❌ 공격이 빗나갔습니다! (대실패)`, 'battle');
            this.enemyTurn(); // 턴 넘어감
            return;
        }

        // 명중 실패 (AC 10 기준 - 혹은 적 레벨 비례)
        // 여기서는 간단히 주사위 8 이상이면 명중으로 설정
        if (hitRoll.total < 8) {
             this.logger.add(`💨 공격이 빗나갔습니다.`, 'battle');
             this.enemyTurn();
             return;
        }

        // 2. 데미지 계산
        let damage = Math.floor(this.player.stats.str * 1.5) - Math.floor(this.currentEnemy.def / 2);
        
        // 치명타 보정
        if (hitRoll.isCrit) {
            damage *= 2;
            this.logger.add(`🔥 <b>치명타!</b> 급소를 가격했습니다!`, 'battle');
        }

        if (damage < 1) damage = 1; // 최소 데미지

        // 적 HP 차감
        this.currentEnemy.hp -= damage;
        this.logger.add(`🗡️ ${this.currentEnemy.name}에게 <b>${damage}</b>의 피해를 입혔습니다.`);

        // 3. 적 사망 체크
        if (this.currentEnemy.hp <= 0) {
            this.winBattle();
        } else {
            // 적이 살아있으면 적의 턴
            setTimeout(() => this.enemyTurn(), 800); // 0.8초 딜레이로 턴 구분
        }
    }

    /**
     * 적의 공격 턴
     */
    enemyTurn() {
        if (!this.isBattleActive) return;

        this.logger.add(`${this.currentEnemy.name}의 공격!`, 'enemy');

        // 적의 명중 판정 (적 레벨 vs 내 민첩)
        // 내 민첩이 높으면 적은 'disadvantage'를 가짐
        const checkType = this.dice.compareStats(this.currentEnemy.lv * 2, this.player.stats.dex);
        // *주의: 여기서 checkType은 적 입장이므로, 내 dex가 높으면 적은 disadvantage여야 함.
        // compareStats 로직 상 (적 공격 - 내 민첩) < -5 이면 disadvantage. 
        
        const hitRoll = this.dice.rollCheck(checkType);

        if (hitRoll.isFumble || hitRoll.total < 8) {
            this.logger.add(`🛡️ 적의 공격을 가볍게 피했습니다.`);
            // 플레이어 턴으로 복귀 (UI 활성화는 Main에서 처리)
            return; 
        }

        // 데미지 계산 (적 공격력 - 내 방어력)
        // 방어구 구현 전이라 방어력 0 가정
        let defense = 0; 
        let damage = this.currentEnemy.atk - defense;
        if (hitRoll.isCrit) damage *= 1.5;
        if (damage < 1) damage = 1;

        const isDead = this.player.takeDamage(Math.floor(damage));
        this.logger.add(`💥 <b>${Math.floor(damage)}</b>의 피해를 입었습니다!`, 'enemy');

        if (isDead) {
            this.loseBattle();
        }
        // 플레이어 턴으로 자동 복귀 (Main Loop에서 버튼 활성화)
    }

    /**
     * 승리 처리
     */
    winBattle() {
        this.isBattleActive = false;
        this.logger.add(`🎉 <b>${this.currentEnemy.name}</b>을(를) 처치했습니다!`, 'loot');
        
        // 보상 지급
        const exp = this.currentEnemy.exp;
        this.player.gainExp(exp);
        this.logger.add(`✨ 경험치 ${exp} 획득.`);

        // 드랍 아이템 (확률)
        if (Math.random() < 0.5 && this.currentEnemy.drop) {
            this.player.addItem(this.currentEnemy.drop, 1);
            this.logger.add(`📦 전리품을 획득했습니다. (ID: ${this.currentEnemy.drop})`, 'loot');
        }

        if (this.onBattleEnd) this.onBattleEnd(true);
    }

    /**
     * 패배 처리
     */
    loseBattle() {
        this.isBattleActive = false;
        this.logger.add(`💀 <b>사망했습니다...</b> 눈앞이 캄캄해집니다.`, 'enemy');
        if (this.onBattleEnd) this.onBattleEnd(false);
    }
    
    /**
     * 도망치기
     */
    tryRun() {
        if (!this.isBattleActive) return false;
        
        // 민첩 비례 확률
        const runChance = this.dice.roll();
        if (runChance > 10) { // 50% 확률 (임시)
            this.isBattleActive = false;
            this.logger.add(`💨 필사적으로 도망쳤습니다!`);
            if (this.onBattleEnd) this.onBattleEnd(true); // 살았으니 true 취급
            return true;
        } else {
            this.logger.add(`😓 도망치지 못했습니다! 발이 묶였습니다.`);
            this.enemyTurn(); // 턴 넘어감
            return false;
        }
    }
}
