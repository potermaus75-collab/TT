import { getItem } from '../data/index.js'; 

export class Player {
    constructor(uiController) {
        this.ui = uiController;

        // 기본 정보
        this.name = "모험가";
        this.lv = 1;
        this.exp = 0;
        this.nextExp = 100;
        this.fightCount = 0; 

        // 순수 스탯 (장비 제외)
        this.baseStats = { str: 10, dex: 10, int: 10, luk: 10 };

        // 생존 수치
        this.maxHp = 100; this.hp = 100;
        this.maxMp = 50;  this.mp = 50;
        this.hunger = 100; 
        this.fatigue = 0; 

        // 인벤토리 & 장비
        this.inventory = []; // { id, count }
        this.equipment = { weapon: null, armor: null, acc: null };
        this.buffs = []; 

        // 테스트용 아이템 (약초, 단검, 가죽갑옷)
        this.addItem(1, 3); 
        this.addItem(101, 1); 
        this.addItem(151, 1);
        
        this.updateUI();
    }

    // 전투용 스탯 계산 (기본 + 장비 + 버프)
    getCombatStats() {
        let s = { ...this.baseStats }; // 복사
        let atk = 0;
        let def = 0;

        // 장비 스탯 적용
        const applyEquip = (part) => {
            if (this.equipment[part]) {
                const item = this.equipment[part];
                if(item.stat) {
                    s.str += item.stat.str || 0;
                    s.dex += item.stat.dex || 0;
                    s.int += item.stat.int || 0;
                    s.luk += item.stat.luk || 0;
                    atk += item.stat.atk || 0;
                    def += item.stat.def || 0;
                }
            }
        };
        applyEquip('weapon');
        applyEquip('armor');
        applyEquip('acc');

        // 기본 공격력/방어력 보정 (힘 비례 공, 체력 비례 방 등)
        atk += Math.floor(s.str * 1.5);
        def += Math.floor(s.dex * 0.5);

        return { ...s, atk, def, maxHp: this.maxHp }; // maxHp는 별도 관리
    }

    // UI 전체 갱신
    updateUI() {
        // 상단 바
        const setBar = (id, cur, max, label) => {
            const pct = Math.max(0, Math.min(100, (cur / max) * 100));
            document.getElementById(`${id}-fill`).style.width = `${pct}%`;
            document.getElementById(`${id}-text`).innerText = `${label} ${Math.floor(cur)}/${max}`;
        };

        setBar('hp', this.hp, this.maxHp, "HP");
        setBar('mp', this.mp, this.maxMp, "MP");
        setBar('hunger', this.hunger, 100, "포만감");
        setBar('fatigue', this.fatigue, 100, "피로도");

        // 레벨 텍스트
        const expPct = Math.floor((this.exp / this.nextExp) * 100);
        document.getElementById('player-lv').innerText = `LV.${this.lv} (${expPct}%)`;
    }

    // 아이템 사용 분기
    useItem(itemId) {
        const itemIdx = this.inventory.findIndex(i => i.id === itemId);
        if (itemIdx === -1) return false;

        const itemData = getItem(itemId);
        if (!itemData) return false;

        // 1. 장비 아이템 -> 장착/해제 토글
        if (itemData.type >= 2) { 
            this.toggleEquip(itemData);
            return true; // UI 갱신 필요
        }

        // 2. 소모품 -> 사용
        if (itemData.effect) {
            this.applyEffect(itemData.effect);
            this.inventory[itemIdx].count--;
            if (this.inventory[itemIdx].count <= 0) {
                this.inventory.splice(itemIdx, 1);
            }
            this.ui.add(`💊 ${itemData.name}을(를) 사용했습니다.`, 'event');
        }

        this.updateUI();
        return true; 
    }

    // 장비 장착/해제 토글 로직
    toggleEquip(item) {
        let slot = 'weapon';
        if (item.type === 3) slot = 'armor';
        if (item.type === 4) slot = 'acc';

        // 이미 장착 중인 아이템인가?
        if (this.equipment[slot] && this.equipment[slot].id === item.id) {
            this.equipment[slot] = null; // 해제
            this.ui.add(`🛡️ ${item.name} 장착을 해제했습니다.`, 'system');
        } else {
            this.equipment[slot] = item; // 장착 (교체)
            this.ui.add(`⚔️ ${item.name}을(를) 장착했습니다.`, 'system');
        }
    }

    applyEffect(eff) {
        switch(eff.type) {
            case 'heal': this.heal(eff.val, 'hp'); break;
            case 'heal_mp': this.heal(eff.val, 'mp'); break;
            case 'food': 
                this.hunger = Math.min(100, this.hunger + eff.val); 
                break;
            // 기타 버프 로직은 추후 확장
        }
    }

    heal(amount, type) {
        if(type === 'hp') this.hp = Math.min(this.maxHp, this.hp + amount);
        else this.mp = Math.min(this.maxMp, this.mp + amount);
        this.updateUI();
    }

    gainExp(amount) {
        this.exp += amount;
        this.ui.add(`✨ 경험치 ${amount} 획득! (${this.exp}/${this.nextExp})`, 'loot');
        
        while (this.exp >= this.nextExp) {
            this.lv++;
            this.exp -= this.nextExp;
            this.nextExp = Math.floor(this.nextExp * 1.5);
            
            // 레벨업 스탯 보너스
            this.maxHp += 20;
            this.hp = this.maxHp;
            this.baseStats.str += 2;
            this.baseStats.dex += 1;
            
            this.ui.add(`🆙 <b>레벨 업! (Lv.${this.lv})</b> 능력치가 상승했습니다!`, 'event');
        }
        this.updateUI();
    }

    consumeStamina(val) {
        this.hunger -= val;
        this.fatigue += val;
        if (this.hunger <= 0) {
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
