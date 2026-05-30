/**
 * 시설 카테고리 트리 — v0.2.3
 * enabled: true 인 것만 팔레트에서 클릭 가능.
 *
 * 활성 30종 (선강 일관 공정):
 *   원료처리 5, 소결 2, 코크스 3, 고로 4, 제강 5, 압연 5, 부대설비 6
 * 비활성 2종: 펠릿 (선강 영역 외, 추후 활성화)
 *
 * source: TEFR M.N. Dastur & Company 2021 (공개 자료)
 */
export const FACILITY_CATEGORIES = [
  {
    id: 'raw_materials',
    name: '원료 처리',
    facilities: [
      { id: 'unloader',    name: '하역설비',    enabled: true },
      { id: 'iron_yard',   name: '철광석 야드', enabled: true },
      { id: 'coal_yard',   name: '석탄 야드',   enabled: true },
      { id: 'stacker',     name: '스태커',      enabled: true },
      { id: 'reclaimer',   name: '리클레이머',  enabled: true },
    ],
  },
  {
    id: 'pellet',
    name: '펠릿',
    facilities: [
      { id: 'pellet_plant',     name: '펠릿 플랜트', enabled: false },
      { id: 'concentrate_yard', name: '정광 야드',   enabled: false },
    ],
  },
  {
    id: 'sinter',
    name: '소결',
    facilities: [
      { id: 'sinter_machine', name: '소결기',    enabled: true },
      { id: 'sinter_cooler',  name: '소결 쿨러', enabled: true },
    ],
  },
  {
    id: 'coke',
    name: '코크스',
    facilities: [
      { id: 'coke_oven',  name: '코크스 오븐', enabled: true },
      { id: 'cdq',        name: 'CDQ',         enabled: true },
      { id: 'coal_tower', name: '석탄 장입탑', enabled: true },
    ],
  },
  {
    id: 'ironmaking',
    name: '고로 영역',
    facilities: [
      { id: 'blast_furnace',   name: '고로',         enabled: true },
      { id: 'hot_stove',       name: '열풍로',        enabled: true },
      { id: 'cast_house',      name: '캐스트 하우스', enabled: true },
      { id: 'slag_granulator', name: '슬래그 처리',   enabled: true },
    ],
  },
  {
    id: 'steelmaking',
    name: '제강',
    facilities: [
      { id: 'bof',         name: '전로(BOF)',       enabled: true },
      { id: 'lf',          name: '레이들 정련로',   enabled: true },
      { id: 'rh',          name: '진공 탈가스(RH)', enabled: true },
      { id: 'cont_caster', name: '연속주조기',      enabled: true },
      { id: 'scrap_yard',  name: '스크랩 야드',     enabled: true },
    ],
  },
  {
    id: 'rolling',
    name: '압연',
    facilities: [
      { id: 'hot_strip_mill', name: '열연 압연기', enabled: true },
      { id: 'cold_rolling',   name: '냉연 압연기', enabled: true },
      { id: 'galv_line',      name: '도금 라인',   enabled: true },
      { id: 'slab_yard',      name: '슬라브 야드', enabled: true },
      { id: 'coil_yard',      name: '코일 야드',   enabled: true },
    ],
  },
  {
    id: 'utilities',
    name: '부대설비',
    facilities: [
      { id: 'asu',             name: '산소 공장',   enabled: true },
      { id: 'power_plant',     name: '발전소',      enabled: true },
      { id: 'water_treatment', name: '용수 처리',   enabled: true },
      { id: 'turboblower',     name: '열풍 송풍기', enabled: true },
      { id: 'gas_holder',      name: '가스 홀더',   enabled: true },
      { id: 'wastewater',      name: '폐수 처리',   enabled: true },
    ],
  },
];
