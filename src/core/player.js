import { ITEM_DB } from '../data/index.js'; // 나중에 아이템 DB 필요

export class Player {
    constructor(uiController) {
        this.ui = uiController; // Logger 인스턴스 등 UI 제어기

        // 1. 기본 정보
        this.name = "방랑자";
        this.lv = 1;
        this.exp = 0;
        this.nextExp = 100;
        
        // 2. 전투 스탯 (힘, 민, 지, 운)
        this.stats = {
            str: 10, // 근력 (물리 공격력)
            dex: 10, // 민첩 (명중률, 도주)
            int: 10, // 지능 (마법, 저항)
            luk: 10  // 운 (치명타, 드랍율)
        };

        // 3. 생존 스탯
        this.maxHp = 100;
        this.hp = 100;
        this.maxMp = 50;
        this.mp = 50;
        
        this.hunger = 100; // 포만감 (0 되면 HP 감소)
        this.fatigue = 0;  // 피로도 (100 되면 행동 불가)

        // 4. 인벤토리 & 장비
        this.inventory = []; // {id, count} 형태
        this.gold = 0;
        this.equipment = {
            weapon: null, // 아이템 객체
            armor: null,
            acc: null
        };

        // 초기화 시 UI 한 번 갱신
        this.updateUI();
    }

    /**
     * 상태창 UI 갱신 (HP, MP 바, 레벨 등)
     */
    updateUI() {
        // 텍스트 갱신
        document.getElementById('player-name').innerText = this.name;
        document.getElementById('player-lv').innerText = `LV.${this.lv}`;
        document.getElementById('hp-text').innerText = `${Math.floor(this.hp)}/${this.maxHp}`;
        document.getElementById('mp-text').innerText = `${Math.floor(this.mp)}/${this.maxMp}`;

        // 게이지 바(CSS width) 갱신
        const hpPercent = Math.max 
(0, Math.min(100, (this.hp / this.maxHp) * 100));
        const mpPercent = Math.max(0, Math.min(100, (this.mp / this.maxMp) * 100));
        
        document.getElementById('hp-fill').style.width = `${hpPercent}%`;
        document.getElementById('mp-fill').style.width = `${mpPercent}%`;
    }

    /**
     * 데미지 처리
     */
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.updateUI();
        
        // 피격 효과 (화면 흔들림)
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 500);

        return this.hp <= 0; // 사망 여부 반환
    }

    /**
     * 회복 처리
     */
    heal(amount, type='hp') {
        if(type === 'hp') {
            this.hp += amount;
            if (this.hp > this.maxHp) this.hp = this.maxHp;
        } else {
            this.mp += amount;
            if (this.mp > this.maxMp) this.mp = this.maxMp;
        }
        this.updateUI();
    }

    /**
     * 경험치 획득 및 레벨업
     */
    gainExp(amount) {
        this.exp += amount;
        
        // 레벨업 루프 (한 번에 2업 할 수도 있으니)
        while (this.exp >= this.nextExp) {
            this.lv++;
            this.exp -= this.nextExp;
            this.nextExp = Math.floor(this.nextExp * 1.5); // 경험치 요구량 1.5배 증가
            
            // 스탯 상승
            this.maxHp += 20;
            this.maxMp += 10;
            this.hp = this.maxHp;
            this.mp = this.maxMp;
            
            this.stats.str += 2;
            this.stats.dex += 2;
            
            // 레벨업 로그는 외부(Logger)에서 호출하거나 여기서 직접 호출
            this.ui.add(`✨ <b>레벨 업! (Lv.${this.lv})</b> 최대 체력이 증가했습니다!`, 'event');
        }
        this.updateUI();
    }

    /**
     * 아이템 획득
     */
    addItem(itemId, count = 1) {
        const existing = this.inventory.find(i => i.id === itemId);
        if (existing) {
            existing.count += count;
        } else {
            this.inventory.push({ id: itemId, count: count });
        }
    }

    /**
     * 행동에 따른 생존 수치 변화 (이동 등)
     */
    consumeStamina(cost = 5) {
        this.hunger -= cost;
        this.fatigue += cost;

        if (this.hunger <= 0) {
            this.hunger = 0;
            this.takeDamage(5); // 아사 데미지
            this.ui.add("배가 너무 고파서 쓰러질 것 같습니다...", "battle");
        }
    }
}
