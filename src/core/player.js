import { getItem } from '../data/index.js'; 

export class Player {
    constructor(uiController) {
        this.ui = uiController;

        // 기본 정보
        this.name = "모험가";
        this.lv = 1;
        this.exp = 0;
        this.nextExp = 100;
        this.fightCount = 0; // 총 싸움 횟수

        // 스탯
        this.stats = { str: 10, dex: 10, int: 10, luk: 10 };

        // 생존 수치
        this.maxHp = 100; this.hp = 100;
        this.maxMp = 50;  this.mp = 50;
        this.hunger = 100; // 포만감
        this.fatigue = 0;  // 피로도

        // 인벤토리 & 효과
        this.inventory = []; // { id, count }
        this.equipment = { weapon: null, armor: null, acc: null };
        this.buffs = []; // { name, desc, turn, stat, val }

        // 테스트용 아이템 지급 (시작할 때)
        this.addItem(1, 3); // 약초 3개
        this.addItem(101, 1); // 단검
        
        this.updateUI();
    }

    // UI 전체 갱신
    updateUI() {
        // 상단 바 텍스트 & 게이지
        const updateBar = (id, cur, max, color) => {
            const pct = Math.max(0, Math.min(100, (cur / max) * 100));
            document.getElementById(`${id}-fill`).style.width = `${pct}%`;
            document.getElementById(`${id}-text`).innerText = `${id.toUpperCase()} ${Math.floor(cur)}/${max}`;
        };

        // HP, MP
        updateBar('hp', this.hp, this.maxHp);
        updateBar('mp', this.mp, this.maxMp);
        
        // Hunger, Fatigue (얘네는 최대치가 100 고정)
        document.getElementById('hunger-fill').style.width = `${this.hunger}%`;
        document.getElementById('hunger-text').innerText = `포만감 ${this.hunger}`;
        
        document.getElementById('fatigue-fill').style.width = `${this.fatigue}%`;
        document.getElementById('fatigue-text').innerText = `피로도 ${this.fatigue}`;

        // 레벨 텍스트
        const expPct = Math.floor((this.exp / this.nextExp) * 100);
        document.getElementById('player-lv').innerText = `LV.${this.lv} (${expPct}%)`;
    }

    // 아이템 획득
    addItem(itemId, count = 1) {
        const existing = this.inventory.find(i => i.id === itemId);
        if (existing) existing.count += count;
        else this.inventory.push({ id: itemId, count: count });
    }

    // 아이템 사용 (가방에서 호출)
    useItem(itemId) {
        const itemIdx = this.inventory.findIndex(i => i.id === itemId);
        if (itemIdx === -1) return false;

        const itemData = getItem(itemId);
        if (!itemData) return false;

        // 장비 아이템이면 장착
        if (itemData.type >= 2) { 
            this.equipItem(itemData);
            return true; // 턴 소모 안함 (장착은 자유)
        }

        // 소모품 효과 적용
        if (itemData.effect) {
            this.applyEffect(itemData.effect);
        }

        // 소모 처리
        this.inventory[itemIdx].count--;
        if (this.inventory[itemIdx].count <= 0) {
            this.inventory.splice(itemIdx, 1);
        }
        
        this.ui.add(`💊 ${itemData.name}을(를) 사용했습니다.`, 'event');
        this.updateUI();
        return true; // 턴 소모
    }

    // 아이템 효과 적용 로직
    applyEffect(eff) {
        switch(eff.type) {
            case 'heal': this.heal(eff.val, 'hp'); break;
            case 'heal_mp': this.heal(eff.val, 'mp'); break;
            case 'food': 
                this.hunger = Math.min(100, this.hunger + eff.val); 
                break;
            case 'buff':
                this.buffs.push({ name: '일시적 강화', desc: `${eff.stat} 증가`, turn: eff.dur/60, stat: eff.stat, val: eff.val });
                break;
        }
    }

    // 장비 장착
    equipItem(itemData) {
        let slot = 'weapon';
        if (itemData.type === 3) slot = 'armor';
        if (itemData.type === 4) slot = 'acc';

        // 기존 장비 해제 (인벤토리로 복귀 안함? -> 귀찮으니 그냥 교체만 구현)
        this.equipment[slot] = itemData;
        this.ui.add(`⚔️ ${itemData.name}을(를) 장착했습니다.`, 'system');
    }

    heal(amount, type) {
        if(type === 'hp') this.hp = Math.min(this.maxHp, this.hp + amount);
        else this.mp = Math.min(this.maxMp, this.mp + amount);
        this.updateUI();
    }

    consumeStamina(val) {
        this.hunger -= val;
        this.fatigue += val;
        if(this.hunger <= 0) {
            this.hunger = 0;
            this.takeDamage(5);
            this.ui.add("배가 고파서 체력이 깎입니다!", "battle");
        }
        this.updateUI();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.updateUI();
        return this.hp <= 0;
    }
}
