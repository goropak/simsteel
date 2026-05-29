/**
 * 시설 카테고리 트리 — v0.2.2 단계
 * enabled: true 인 것만 팔레트에서 클릭 가능.
 * v0.2.3에서 나머지 enabled: true 로 일괄 전환 예정.
 */
export const FACILITY_CATEGORIES = [
  {
    id: 'raw_materials',
    name: '원료 처리',
    facilities: [
      { id: 'unloader',    name: '하역설비',     enabled: false },
      { id: 'iron_yard',   name: '철광석 야드',   enabled: false },
      { id: 'coal_yard',   name: '석탄 야드',     enabled: false },
      { id: 'stacker',     name: '스태커',        enabled: false },
      { id: 'reclaimer',   name: '리클레이머',    enabled: false },
    ],
  },
  {
    id: 'pellet',
    name: '펠릿',
    facilities: [
      { id: 'pellet_plant',      name: '펠릿 플랜트', enabled: false },
      { id: 'concentrate_yard',  name: '정광 야드',   enabled: false },
    ],
  },
  {
    id: 'sinter',
    name: '소결',
    facilities: [
      { id: 'sinter_machine', name: '소결기', enabled: false },
      { id: 'sinter_cooler',  name: '쿨러',   enabled: false },
    ],
  },
  {
    id: 'coke',
    name: '코크스',
    facilities: [
      { id: 'coke_oven',   name: '코크스 오븐',  enabled: false },
      { id: 'cdq',         name: 'CDQ',          enabled: false },
      { id: 'coal_tower',  name: '석탄 장입탑',  enabled: false },
    ],
  },
  {
    id: 'ironmaking',
    name: '고로 영역',
    facilities: [
      { id: 'blast_furnace',   name: '고로',        enabled: true },  // v0.2.2 활성
      { id: 'hot_stove',       name: '열풍로',       enabled: false },
      { id: 'cast_house',      name: '캐스트 하우스', enabled: false },
      { id: 'slag_granulator', name: '슬래그 처리',  enabled: false },
    ],
  },
];
