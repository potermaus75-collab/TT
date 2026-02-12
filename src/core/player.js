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
        this.gold = 50; // 초기 자금

        // 순수 기본 스탯 (포인트 투자 가능)
        this.baseStats = { str: 10, dex: 10, int: 10, luk: 10 };
        this.statPoints = 0; // 투자 가능한 스탯 포인트

        // 생존 수치
        this.maxHp = 100; this.hp = 100;
        this.maxMp = 50;  this.mp = 50;
        this.hunger = 100; 
        this.fatigue = 0; 

        // 인벤토리 & 장비
        this.inventory = []; 
        this.equipment = { weapon: null, armor: null, acc: null };

        // 초기 아이템 지급
        this.addItem(1, 2); // 약초
        this.addItem(101, 1); // 단검
        this.addItem(151, 1); // 가죽갑옷
        
        this.updateUI();
    }

    // 전투용 최종 스탯 계산
    getCombatStats() {
        let s = { ...this.baseStats }; 
        let atk = 0;
        let def = 0;

        // 장비 스탯 합산
        ['weapon', 'armor', 'acc'].forEach(part => {
            const item = this.equipment[part];
            if (item && item.stat) {
                if(item.stat.str) s.str += item.stat.str;
                if(item.stat.dex) s.dex += item.stat.dex;
                if(item.stat.int) s.int += item.stat.int;
                if(item.stat.luk) s.luk += item.stat.luk;
                if(item.stat.atk) atk += item.stat.atk;
                if(item.stat.def) def += item.stat.def;
            }
        });

        // 기본 보정
        atk += Math.floor(s.str * 1.5);
        def += Math.floor(s.dex * 0.5);

        return { ...s, atk, def, maxHp: this.maxHp, maxMp: this.maxMp };
    }

    updateUI() {
        const setBar = (id, cur, max) => {
            const elFill = document.getElementById(`${id}-fill`);
            const elText = document.getElementById(`${id}-text`);
            if(elFill && elText) {
                const pct = Math.max(0, Math.min(100, (cur / max) * 100));
                elFill.style.width = `${pct}%`;
                // 텍스트를 정확한 수치로 표시
                elText.innerText = `${Math.floor(cur)}/${max}`;
            }
        };

        setBar('hp', this.hp, this.maxHp);
        setBar('mp', this.mp, this.maxMp);
        
        // 포만감, 피로도는 100 기준
        document.getElementById('hunger-text').innerText = `${Math.floor(this.hunger)}`;
        document.getElementById('hunger-fill').style.width = `${this.hunger}%`;
        
        document.getElementById('fatigue-text').innerText = `${Math.floor(this.fatigue)}`;
        document.getElementById('fatigue-fill').style.width = `${this.fatigue}%`;

        // 골드 및 레벨 표시
        document.getElementById('player-gold').innerText = this.gold.toLocaleString();
        
        const elLv = document.getElementById('player-lv');
        if(elLv) {
            const expPct = Math.floor((this.exp / this.nextExp) * 100);
            elLv.innerText = `LV.${this.lv} (${expPct}%)`;
        }
    }

    addItem(id, count = 1) {
        const existingItem = this.inventory.find(i => i.id === id);
        if (existingItem) {
            existingItem.count += count;
        } else {
            this.inventory.push({ id: id, count: count });
        }
        this.updateUI();
    }

    useItem(itemId) {
        const idx = this.inventory.findIndex(i => i.id === itemId);
        if (idx === -1) return false;

        const itemData = getItem(itemId);
        if (!itemData) return false;

        // 장비 -> 장착
        if (itemData.type >= 2) { 
            this.toggleEquip(itemData);
            return true; 
        }

        // 소모품 -> 효과
        if (itemData.effect) {
            this.applyEffect(itemData.effect);
            this.inventory[idx].count--;
            if (this.inventory[idx].count <= 0) {
                this.inventory.splice(idx, 1);
            }
            this.ui.add(`💊 ${itemData.name} 사용함.`, 'heal');
        }

        this.updateUI();
        return true; 
    }

    toggleEquip(item) {
        let slot = 'weapon';
        if (item.type === 3) slot = 'armor';
        if (item.type === 4) slot = 'acc';

        if (this.equipment[slot] && this.equipment[slot].id === item.id) {
            this.equipment[slot] = null;
            this.ui.add(`🛡️ ${item.name} 해제.`, 'system');
        } else {
            this.equipment[slot] = item;
            this.ui.add(`⚔️ ${item.name} 장착!`, 'system');
        }
    }

    applyEffect(eff) {
        switch(eff.type) {
            case 'heal': this.heal(eff.val, 'hp'); break;
            case 'heal_mp': this.heal(eff.val, 'mp'); break;
            case 'food': this.hunger = Math.min(100, this.hunger + eff.val); break;
        }
    }

    heal(amount, type) {
        if(type === 'hp') this.hp = Math.min(this.maxHp, this.hp + amount);
        else this.mp = Math.min(this.maxMp, this.mp + amount);
        this.updateUI();
    }

    // 경험치 획득 및 SP 지급
    gainExp(amount) {
        this.exp += amount;
        
        while (this.exp >= this.nextExp) {
            this.lv++;
            this.exp -= this.nextExp;
            this.nextExp = Math.floor(this.nextExp * 1.5);
            
            // 보너스: 최대 HP 증가 및 포인트 지급
            this.maxHp += 10;
            this.hp = this.maxHp;
            this.statPoints += 3; // 레벨업당 3포인트
            
            this.ui.add(`🆙 <b>레벨 업! (Lv.${this.lv})</b> SP 3 획득!`, 'event');
        }
        this.updateUI();
    }

    // 스탯 수동 투자
    raiseStat(statKey) {
        if (this.statPoints > 0) {
            this.baseStats[statKey]++;
            this.statPoints--;
            this.ui.add(`💪 ${statKey.toUpperCase()} 스탯 상승!`, 'system');
            this.updateUI();
            return true;
        }
        return false;
    }

    consumeStamina(val) {
        this.hunger -= val;
        this.fatigue += val;
        if (this.hunger <= 0) {
            this.hunger = 0;
            if(this.takeDamage(5)) {
                this.ui.add("배가 고파서 쓰러졌습니다...", "battle");
            } else {
                this.ui.add("배가 너무 고픕니다...", "battle");
            }
        }
        this.updateUI();
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.updateUI();
        return this.hp <= 0;
    }
}
