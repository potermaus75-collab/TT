import { Dice } from './core/dice.js';
import { Logger } from './core/logger.js';
import { Player } from './core/player.js';
import { CombatManager } from './core/combat.js';
import { getRandomMonster, getItem } from './data/index.js';

class Game {
    constructor() {
        this.logger = new Logger();
        this.dice = new Dice();
        this.player = new Player(this.logger);
        this.combat = new CombatManager(this.player, this.dice, this.logger);
        
        this.bindEvents();
        this.ui = {
            closeModals: () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            }
        };
        window.game = this;
    }

    bindEvents() {
        document.querySelectorAll('#action-bar .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMenu(e.target.dataset.action));
        });
    }

    handleMenu(action) {
        if (this.combat.isBattle) return;
        switch(action) {
            case 'explore': this.explore(); break;
            case 'inventory': this.openInventory(); break;
            case 'status': this.openStatus(); break;
            case 'rest': this.rest(); break;
        }
    }

    explore() {
        this.player.consumeStamina(3);
        if (this.player.hp <= 0) return;

        const roll = Math.random();
        if (roll < 0.4) {
            const mob = getRandomMonster(this.player.lv, this.player.lv+2);
            this.combat.startBattle(mob, (win, enemy) => {
                if (win && enemy) { // enemy가 null이면 도망친 것
                    this.logger.add(`🎉 <b>${enemy.name}</b> 처치!`, "loot");
                    this.player.gainExp(enemy.exp); // 경험치 획득!
                    
                    if(enemy.drop) {
                        this.player.addItem(enemy.drop);
                        const dropItem = getItem(enemy.drop);
                        if(dropItem) this.logger.add(`📦 전리품 [${dropItem.name}] 획득`, "loot");
                    }
                } else if (!win) {
                    this.logger.add("💀 눈앞이 캄캄해집니다... (사망)", "battle");
                    // 여기서 게임 오버 처리나 부활 로직 추가 가능
                }
            });
        } else {
            const events = ["숲이 조용합니다.", "나뭇잎 흔들리는 소리만 들립니다.", "무언가 지나간 흔적이 있습니다."];
            this.logger.add(events[Math.floor(Math.random()*events.length)]);
        }
    }

    openInventory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        const p = this.player;

        if(p.inventory.length === 0) {
            list.innerHTML = '<p>가방이 비어있습니다.</p>';
        }

        p.inventory.forEach(slot => {
            const item = getItem(slot.id);
            if(!item) return;

            // 장착 여부 확인
            const isEquipped = (p.equipment.weapon?.id === item.id) || 
                               (p.equipment.armor?.id === item.id) || 
                               (p.equipment.acc?.id === item.id);

            const div = document.createElement('div');
            div.className = `inv-item ${isEquipped ? 'equipped' : ''}`;
            
            // E 뱃지 추가
            let badge = isEquipped ? '<span class="equip-badge">E</span>' : '';
            
            div.innerHTML = `
                ${badge}
                <div class="item-name">${item.name}</div>
                <div class="item-count">x${slot.count}</div>
            `;
            
            div.onclick = () => {
                const updated = p.useItem(slot.id);
                if(updated) this.openInventory(); // 목록 갱신 (E 표시 등)
            };
            list.appendChild(div);
        });

        document.getElementById('modal-inventory').classList.remove('hidden');
    }

    openStatus() {
        const p = this.player;
        const s = p.getCombatStats(); // 종합 스탯 가져오기

        document.getElementById('stat-fight-count').innerText = p.fightCount;
        document.getElementById('stat-exp').innerText = `${p.exp} / ${p.nextExp}`;
        
        // 상세 스탯 표시
        const detailHTML = `
            <div class="stat-grid">
                <div>⚔️ 공격력: ${s.atk}</div>
                <div>🛡️ 방어력: ${s.def}</div>
                <div>❤️ 체력: ${Math.floor(p.hp)} / ${p.maxHp}</div>
                <div>💧 마나: ${Math.floor(p.mp)} / ${p.maxMp}</div>
                <div>🍖 포만감: ${p.hunger}</div>
                <div>💤 피로도: ${p.fatigue}</div>
            </div>
        `;
        
        const equipList = document.getElementById('stat-equip-list');
        const w = p.equipment.weapon ? p.equipment.weapon.name : "(없음)";
        const a = p.equipment.armor ? p.equipment.armor.name : "(없음)";
        const ac = p.equipment.acc ? p.equipment.acc.name : "(없음)";
        
        equipList.innerHTML = detailHTML + `<hr><p>⚔️ 무기: ${w}</p><p>🛡️ 방어구: ${a}</p><p>💍 장신구: ${ac}</p>`;

        document.getElementById('modal-status').classList.remove('hidden');
    }

    rest() {
        this.logger.add("⛺ 휴식을 취해 체력을 회복합니다.", "event");
        this.player.heal(30, 'hp');
        this.player.heal(10, 'mp');
        this.player.consumeStamina(10);
    }
}

window.onload = () => new Game();
