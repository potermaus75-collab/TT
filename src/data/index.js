import { MONSTER_DB } from './monsters.js';
import { ITEM_DB } from './items.js';

const MonsterMap = new Map(MONSTER_DB.map(m => [m.id, m]));
const ItemMap = new Map(ITEM_DB.map(i => [i.id, i]));

/**
 * ID로 몬스터 정보 조회 (데이터 보호를 위해 복사본 반환)
 */
export function getMonster(id) {
    const data = MonsterMap.get(id);
    return data ? JSON.parse(JSON.stringify(data)) : null;
}

/**
 * ID로 아이템 정보 조회 (데이터 보호를 위해 복사본 반환)
 */
export function getItem(id) {
    const data = ItemMap.get(id);
    return data ? JSON.parse(JSON.stringify(data)) : null;
}

/**
 * 랜덤 몬스터 뽑기
 */
export function getRandomMonster(minLv = 1, maxLv = 100) {
    const candidates = MONSTER_DB.filter(m => m.lv >= minLv && m.lv <= maxLv);
    if (candidates.length === 0) return JSON.parse(JSON.stringify(MONSTER_DB[0]));
    
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return JSON.parse(JSON.stringify(candidates[randomIndex]));
}

export { MONSTER_DB, ITEM_DB };
