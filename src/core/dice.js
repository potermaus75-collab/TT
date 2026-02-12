export class Dice {
    constructor() {
        this.sides = 20; // d20 시스템
    }

    /**
     * 기본 주사위 굴리기
     * @returns {number} 1~20
     */
    roll() {
        return Math.floor(Math.random() * this.sides) + 1;
    }

    /**
     * 상성 보정 주사위 (Weighted Roll)
     * @param {string} type - 'advantage'(유리함) | 'disadvantage'(불리함) | 'normal'
     * @returns {object} { total: 결과값, isCrit: 치명타여부, isFumble: 대실패여부, rolls: [주사위1, 주사위2] }
     */
    rollCheck(type = 'normal') {
        const r1 = this.roll();
        const r2 = this.roll();
        
        let finalVal = r1;
        let usedRolls = [r1];

        if (type === 'advantage') {
            finalVal = Math.max(r1, r2);
            usedRolls = [r1, r2];
        } else if (type === 'disadvantage') {
            finalVal = Math.min(r1, r2);
            usedRolls = [r1, r2];
        }

        return {
            total: finalVal,
            isCrit: finalVal === 20,
            isFumble: finalVal === 1,
            rolls: usedRolls,
            type: type
        };
    }

    /**
     * 스탯 비교를 통한 상성 판단
     * @param {number} myStat - 나의 스탯 (예: 힘)
     * @param {number} targetStat - 상대의 스탯 (예: 방어)
     * @returns {string} 'advantage' | 'disadvantage' | 'normal'
     */
    compareStats(myStat, targetStat) {
        const diff = myStat - targetStat;
        if (diff >= 5) return 'advantage'; // 내 스탯이 5 이상 높으면 유리
        if (diff <= -5) return 'disadvantage'; // 내 스탯이 5 이상 낮으면 불리
        return 'normal';
    }
}
