import { getItem } from '../data/index.js'; 

export class Player {
    constructor(uiController) {
        this.ui = uiController;
        this.reset();
    }

    // 초기화
    reset(name = "모험가") {
        this.name = name;
        this.lv = 1;
        this.exp = 0;
        this.nextExp = 100;
        this.fightCount = 0; 
        this.gold = 50; 

        // [리메이크된 스탯]
        // str: 힘 (물리공격력, HP)
        // int: 지능 (마법공격력, Mental)
        // dex: 민첩 (치명타, 회피)
        // cha: 매력 (상점 할인, 이벤트)
        this.baseStats = { str: 10, int: 10, dex: 10, cha: 10 };
        this.statPoints = 0;

        // 생존 수치 (Max 값은 스탯에 따라 변동)
        this.hp = 150; 
        this.mp = 100; // Mental
        this.hunger = 100; 
        this.fatigue = 0; 

        this.inventory = []; 
        this.equipment = { weapon: null, armor: null, acc: null };

        // 초기 아이템
        this.addItem(1, 2); // 약초
        this.addItem(101, 1); // 단검
        this.addItem(151, 1); // 가죽갑옷
    }

    // 전투 및 UI 표기용 최종 스탯 계산
    getCombatStats() {
        let s = { ...this.baseStats }; 
        let atk = 0; // 물리/마법 통합 표기용
        let def = 0;

        // 장비 스탯 합산
        ['weapon', 'armor', 'acc'].forEach(part => {
            const item = this.equipment[part];
            if (item && item.stat) {
                if(item.stat.str) s.str += item.stat.str;
                if(item.stat.int) s.int += item.stat.int;
                if(item.stat.dex) s.dex += item.stat.dex;
                if(item.stat.luk) s.cha += item.stat.luk; // 기존 아이템 데이터 호환 (luk -> cha 취급)
                if(item.stat.atk) atk += item.stat.atk;
                if(item.stat.def) def += item.stat.def;
            }
        });

        // [스탯 파생 공식]
        // 1. 최대 HP = 기본 100 + (STR * 5)
        const maxHp = 100 + (s.str * 5);
        
        // 2. 최대 Mental(MP) = 기본 50 + (INT * 5)
        const maxMp = 50 + (s.int * 5);

        // 3. 공격력 보정 (무기 타입에 따라 다름, 여기선 단순 표기용으로 STR 기준)
        // 실제 데미지는 CombatManager에서 무기 타입 체크 후 계산
        // 기본 맨손은 STR 기반
        atk += Math.floor(s.str * 1.0); 

        // 4. 방어력 (DEF 스탯 삭제 -> 오직 장비만 영향)
        // def는 위에서 장비 합산된 값 그대로 사용

        // 5. 치명타/회피 (DEX 기반)
        const critChance = Math.floor(s.dex * 0.5); // 10 dex = 5%
        const evasion = Math.floor(s.dex * 0.2); 

        return { ...s, atk, def, maxHp, maxMp, critChance, evasion };
    }

    updateUI() {
        const s = this.getCombatStats();

        // HP/MP 오버플로우 방지 및 갱신
        if (this.hp > s.maxHp) this.hp = s.maxHp;
        if (this.mp > s.maxMp) this.mp = s.maxMp;

        const setBar = (id, cur, max, label) => {
            const elFill = document.getElementById(`${id}-fill`);
            const elText = document.getElementById(`${id}-text`);
            if(elFill && elText) {
                const pct = Math.max(0, Math.min(100, (cur / max) * 100));
                elFill.style.width = `${pct}%`;
                elText.innerText = `${Math.floor(cur)}/${max}`;
            }
        };

        setBar('hp', this.hp, s.maxHp);
        setBar('mp', this.mp, s.maxMp);
        
        document.getElementById('hunger-text').innerText = `${Math.floor(this.hunger)}`;
        document.getElementById('hunger-fill').style.width = `${this.hunger}%`;
        
        document.getElementById('fatigue-text').innerText = `${Math.floor(this.fatigue)}`;
        document.getElementById('fatigue-fill').style.width = `${this.fatigue}%`;

        document.getElementById('player-gold').innerText = this.gold.toLocaleString();
        document.getElementById('player-name').innerText = this.name;
        
        const elLv = document.getElementById('player-lv');
        if(elLv) {
            const expPct = Math.floor((this.exp / this.nextExp) * 100);
            elLv.innerText = `LV.${this.lv} (${expPct}%)`;
        }

        // 턴이 끝날 때마다 자동 저장
        this.saveData();
    }

    // 저장
    saveData() {
        if (!this.name) return;
        const data = {
            name: this.name,
            lv: this.lv,
            exp: this.exp,
            nextExp: this.nextExp,
            gold: this.gold,
            baseStats: this.baseStats,
            statPoints: this.statPoints,
            hp: this.hp,
            mp: this.mp,
            hunger: this.hunger,
            fatigue: this.fatigue,
            inventory: this.inventory,
            equipment: this.equipment,
            fightCount: this.fightCount
        };
        localStorage.setItem(`TRPG_${this.name}`, JSON.stringify(data));
    }

    // 불러오기
    loadData(name) {
        const json = localStorage.getItem(`TRPG_${name}`);
        if (!json) return false;

        const data = JSON.parse(json);
        this.name = data.name;
        this.lv = data.lv;
        this.exp = data.exp;
        this.nextExp = data.nextExp;
        this.gold = data.gold;
        this.baseStats = data.baseStats; // 호환성 주의 (구버전 데이터면 깨질 수 있음)
        if (!this.baseStats.cha) this.baseStats.cha = 10; // 신규 스탯 보정

        this.statPoints = data.statPoints;
        this.hp = data.hp;
        this.mp = data.mp;
        this.hunger = data.hunger;
        this.fatigue = data.fatigue;
        this.inventory = data.inventory;
        this.equipment = data.equipment;
        this.fightCount = data.fightCount || 0;
        
        this.updateUI();
        return true;
    }

    // 사망 처리 (데이터 삭제)
    die() {
        this.ui.add(`💀 <b>${this.name}</b>의 심장이 멈췄습니다...`, "battle");
        this.ui.add("잠시 후 타이틀 화면으로 이동합니다...", "system");
        
        // 데이터 삭제 (로그라이크)
        localStorage.removeItem(`TRPG_${this.name}`);

        setTimeout(() => {
            window.game.goToTitle();
        }, 3000);
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
        // 인벤토리 인덱스 대신 ID로 찾기 (배열 변경 안전성 확보)
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
            // 수량 감소 로직 안전하게 처리
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
        const s = this.getCombatStats();
        switch(eff.type) {
            case 'heal': this.hp = Math.min(s.maxHp, this.hp + eff.val); break;
            case 'heal_mp': this.mp = Math.min(s.maxMp, this.mp + eff.val); break;
            case 'full_restore': 
                this.hp = s.maxHp; 
                this.mp = s.maxMp; 
                break;
            case 'food': this.hunger = Math.min(100, this.hunger + eff.val); break;
        }
    }

    heal(amount, target = 'hp') {
        const s = this.getCombatStats();
        if (target === 'mp') {
            this.mp = Math.min(s.maxMp, this.mp + amount);
        } else {
            this.hp = Math.min(s.maxHp, this.hp + amount);
        }
        this.updateUI();
    }

    gainExp(amount) {
        this.exp += amount;
        while (this.exp >= this.nextExp) {
            this.lv++;
            this.exp -= this.nextExp;
            this.nextExp = Math.floor(this.nextExp * 1.5);
            
            this.hp = this.getCombatStats().maxHp; // 레벨업 시 체력 회복
            this.mp = this.getCombatStats().maxMp; // 정신력 회복
            this.statPoints += 3; 
            
            this.ui.add(`🆙 <b>레벨 업! (Lv.${this.lv})</b> SP 3 획득!`, 'event');
        }
        this.updateUI();
    }

    raiseStat(statKey) {
        if (this.statPoints > 0) {
            this.baseStats[statKey]++;
            this.statPoints--;
            
            // 한글 스탯명 매핑
            const statName = {str:"힘", int:"지능", dex:"민첩", cha:"매력"}[statKey];
            this.ui.add(`💪 ${statName} 상승!`, 'system');
            
            this.updateUI();
            return true;
        }
        return false;
    }

    consumeStamina(val) {
        this.hunger -= val;
        this.fatigue += val;
        
        let died = false;

        // 배고픔 데미지
        if (this.hunger <= 0) {
            this.hunger = 0;
            this.ui.add("배가 고파서 정신이 혼미해집니다... (HP -10)", "battle");
            died = this.takeDamage(10);
        }

        this.updateUI();
        return died; // 사망 여부 반환
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.updateUI();
            return true; // 사망 확인
        }
        this.updateUI();
        return false;
    }

    // 마법 무기 판별 (지능 보정용)
    isMagicWeapon() {
        const w = this.equipment.weapon;
        if (!w) return false; // 맨손은 물리
        const name = w.name;
        // 이름에 지팡이, 완드, 오브 등이 들어가거나 특정 ID 대역이면 마법 무기
        if (name.includes("지팡이") || name.includes("완드") || name.includes("오브") || name.includes("마법")) return true;
        return false;
    }
}
