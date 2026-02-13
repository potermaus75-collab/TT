import { Dice } from './core/dice.js';
import { Logger } from './core/logger.js';
import { Player } from './core/player.js';
import { CombatManager } from './core/combat.js';
import { getRandomMonster, getItem, MONSTER_DB, ITEM_DB } from './data/index.js';

class Game {
    constructor() {
        this.logger = new Logger();
        this.dice = new Dice();
        this.player = new Player(this.logger);
        this.combat = new CombatManager(this.player, this.dice, this.logger);
        
        window.game = this; 
        this.ui = {
            closeModals: () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            },
            add: (msg, type) => this.logger.add(msg, type)
        };

        this.bindEvents();
    }

    bindEvents() {
        // 타이틀 화면 시작 버튼
        document.getElementById('btn-start').onclick = () => {
            const nameInput = document.getElementById('input-name');
            const name = nameInput.value.trim();
            if (name.length < 1) {
                alert("이름을 입력해주세요!");
                return;
            }
            this.startGame(name);
        };

        // 하단 메뉴 버튼
        document.querySelectorAll('#action-bar .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMenu(e.target.dataset.action));
        });
    }

    startGame(name) {
        // 타이틀 숨기고 게임 화면 표시
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');

        // 로드 시도
        if (this.player.loadData(name)) {
            this.logger.add(`👋 돌아오셨군요, ${name}님!`, "system");
        } else {
            this.player.reset(name);
            this.logger.add(`⚔️ 새로운 모험이 시작됩니다. 환영합니다, ${name}!`, "system");
            this.player.saveData(true); // 첫 저장
        }
        this.player.updateUI();
    }

    goToTitle() {
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');
        document.getElementById('input-name').value = "";
        
        // 상태창 등 초기화
        this.ui.closeModals();
        this.logger.container.innerHTML = '<div class="log-entry system">시스템 로딩 완료...</div>';
    }

    handleMenu(action) {
        if (this.combat.isBattle) return;
        if (this.player.hp <= 0) return; // 죽으면 조작 불가

        switch(action) {
            case 'explore': this.explore(); break;
            case 'inventory': this.openInventory(); break;
            case 'status': this.openStatus(); break;
            case 'encyclopedia': this.openEncyclopedia(); break;
        }
    }

    explore() {
        // 1. 상태 체크 (배고픔 데미지로 사망 시 즉시 중단)
        const isDead = this.player.consumeStamina(3);
        if (isDead) {
            this.player.die();
            return;
        }

        if (this.player.fatigue >= 100) {
            this.logger.add("💤 너무 피곤해서 움직일 수 없습니다. 여관을 찾으세요!", "event");
            return;
        }

        // 2. 랜덤 이벤트
        const roll = Math.random();

        if (roll < 0.35) {
            // [전투] 35%
            const mob = getRandomMonster(this.player.lv, this.player.lv + 2);
            this.combat.startBattle(mob, (win, enemy) => {
                if (win) {
                    if (enemy) {
                        const goldReward = enemy.lv * 10 + Math.floor(Math.random() * 10);
                        this.logger.add(`🎉 ${enemy.name} 처치!`, "loot");
                        this.player.gainExp(enemy.exp);
                        this.player.gold += goldReward;
                        this.logger.add(`💰 ${goldReward} Gold 획득!`, "loot");
                        
                        if(enemy.drop) {
                            this.player.addItem(enemy.drop);
                            const item = getItem(enemy.drop);
                            if(item) this.logger.add(`📦 [${item.name}] 획득!`, "loot");
                        }
                    } else {
                        this.logger.add("💨 무사히 도망쳤습니다.");
                    }
                } else {
                    // 패배 시 사망 처리 (전투 매니저에서 처리하거나 여기서 호출)
                    // CombatManager가 endBattle(false)를 호출하면 여기서 처리
                    this.player.die();
                }
                this.player.saveData(true); // 전투 종료 후 자동 저장
            });

        } else if (roll < 0.50) {
            // [보물상자] 15%
            const foundGold = Math.floor(Math.random() * 50) + 10;
            this.logger.add(`🎁 낡은 보물상자를 발견했습니다! ${foundGold}G 획득!`, "loot");
            this.player.gold += foundGold;
            this.player.updateUI();

        } else if (roll < 0.60) {
            // [떠돌이 상인] 10%
            this.logger.add("👋 길가에서 떠돌이 상인을 만났습니다.", "event");
            this.openShop();

        } else if (roll < 0.70) {
            // [여관 발견] 10%
            this.foundInn();

        } else {
            // [일반] 30%
            const msgs = ["숲길을 걷습니다...", "바람이 상쾌합니다.", "어디선가 새소리가 들립니다."];
            this.logger.add(msgs[Math.floor(Math.random()*msgs.length)]);
        }
    }

    openShop() {
        const list = document.getElementById('shop-list');
        list.innerHTML = '';
        
        // 매력(CHA)에 따른 할인율 계산 (1 CHA당 1% 할인, 최대 50%)
        const cha = this.player.getCombatStats().cha;
        const discountRate = Math.min(0.5, cha * 0.01);
        
        document.getElementById('shop-msg').innerText = 
            discountRate > 0 ? `(매력 보너스: ${Math.floor(discountRate*100)}% 할인 적용 중)` : "필요한 물건이 있나?";

        const saleItems = [1, 5, 8, 9, 21, 28, 101, 151]; 
        
        saleItems.forEach(id => {
            const item = getItem(id);
            if(!item) return;
            
            let originalPrice = item.val * 2;
            let finalPrice = Math.floor(originalPrice * (1 - discountRate));

            const div = document.createElement('div');
            div.className = 'inv-item';
            div.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-price">💰 ${finalPrice}G</div>
            `;
            div.onclick = () => this.buyItem(item, finalPrice);
            list.appendChild(div);
        });

        document.getElementById('modal-shop').classList.remove('hidden');
    }

    buyItem(item, price) {
        if (this.player.gold >= price) {
            this.player.gold -= price;
            this.player.addItem(item.id, 1);
            this.logger.add(`🛒 ${item.name} 구매 완료!`, "loot");
            this.player.updateUI();
        } else {
            alert("골드가 부족합니다!");
        }
    }

    foundInn() {
        const cost = 50;
        if (confirm(`🏨 숲속의 낡은 여관을 발견했습니다.\n${cost}골드를 내고 푹 쉬시겠습니까?\n(체력/정신력/피로도 완전 회복)`)) {
            if (this.player.gold >= cost) {
                this.player.gold -= cost;
                this.player.heal(9999, 'hp');
                this.player.heal(9999, 'mp'); // Mental
                this.player.fatigue = 0;
                this.player.hunger = 100; 
                this.logger.add("🛌 여관에서 푹 쉬었습니다. 컨디션 최고!", "heal");
                this.player.updateUI();
            } else {
                this.logger.add("💸 돈이 없어서 쫓겨났습니다...", "battle");
            }
        } else {
            this.logger.add("여관을 지나쳤습니다.");
        }
    }

    openInventory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        const p = this.player;

        if(p.inventory.length === 0) list.innerHTML = '<p>가방이 비어있습니다.</p>';

        p.inventory.forEach(slot => {
            const item = getItem(slot.id);
            if(!item) return;

            const isEquipped = (p.equipment.weapon?.id === item.id) || 
                               (p.equipment.armor?.id === item.id) || 
                               (p.equipment.acc?.id === item.id);

            const div = document.createElement('div');
            div.className = `inv-item ${isEquipped ? 'equipped' : ''}`;
            let badge = isEquipped ? '<span class="equip-badge">E</span>' : '';
            
            div.innerHTML = `
                ${badge}
                <div class="item-name">${item.name}</div>
                <div class="item-count">x${slot.count}</div>
            `;
            
            div.onclick = () => {
                const updated = p.useItem(slot.id);
                if(updated) this.openInventory();
            };
            list.appendChild(div);
        });

        document.getElementById('modal-inventory').classList.remove('hidden');
    }

    openStatus() {
        const p = this.player;
        const s = p.getCombatStats();
        const base = p.baseStats;

        const makeRow = (label, key, val, total) => `
            <div class="stat-row">
                <span>${label} <small>(기본${val})</small></span>
                <div>
                    <span id="val-${key}">${total}</span>
                    <button class="btn-up" onclick="game.upStat('${key}')" ${p.statPoints > 0 ? '' : 'disabled'}>+</button>
                </div>
            </div>
        `;

        const detailHTML = `
            ${makeRow("💪 힘(STR)", "str", base.str, s.str)}
            ${makeRow("🧠 지능(INT)", "int", base.int, s.int)}
            ${makeRow("🏃 민첩(DEX)", "dex", base.dex, s.dex)}
            ${makeRow("✨ 매력(CHA)", "cha", base.cha, s.cha)}
            <hr>
            <div class="stat-row"><span>⚔️ 공격력</span> <span>${s.atk} (무기반영)</span></div>
            <div class="stat-row"><span>🛡️ 방어력</span> <span>${s.def} (장비)</span></div>
            <div class="stat-row"><span>⚡ 치명타</span> <span>${s.critChance}%</span></div>
            <div class="stat-row"><span>💨 회피율</span> <span>${s.evasion}%</span></div>
            <div class="stat-equip">
                <p>🗡️: ${p.equipment.weapon ? p.equipment.weapon.name : '-'}</p>
                <p>🛡️: ${p.equipment.armor ? p.equipment.armor.name : '-'}</p>
                <p>💍: ${p.equipment.acc ? p.equipment.acc.name : '-'}</p>
            </div>
        `;
        
        document.getElementById('stat-detail-area').innerHTML = detailHTML;
        document.getElementById('sp-display').innerText = `남은 포인트(SP): ${p.statPoints}`;
        document.getElementById('modal-status').classList.remove('hidden');
    }

    upStat(key) {
        if (this.player.raiseStat(key)) {
            this.openStatus();
        } else {
            alert("포인트가 부족합니다!");
        }
    }

    openEncyclopedia() {
        this.switchDex('monster');
        document.getElementById('modal-encyclopedia').classList.remove('hidden');
    }

    switchDex(type) {
        const list = document.getElementById('dex-list');
        list.innerHTML = '';
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const btnIdx = type === 'monster' ? 0 : 1;
        document.querySelectorAll('.tab-btn')[btnIdx].classList.add('active');

        if (type === 'monster') {
            MONSTER_DB.forEach(m => {
                const div = document.createElement('div');
                div.className = 'dex-item';
                div.innerHTML = `
                    <span class="name">[Lv.${m.lv}] ${m.name}</span>
                    <span class="desc">HP:${m.hp}</span>
                `;
                list.appendChild(div);
            });
        } else {
            ITEM_DB.forEach(i => {
                const div = document.createElement('div');
                div.className = 'dex-item';
                div.innerHTML = `
                    <span class="name">${i.name}</span>
                    <span class="desc">${i.val}G</span>
                `;
                list.appendChild(div);
            });
        }
    }
}

window.onload = () => new Game();
