/**
 * 이미지 레이어(다중) 렌더러 — v0.4.3 (feature 6)
 *
 * imageLayerStore의 레이어들을 보드 위 반투명 이미지로 겹쳐 그린다.
 * depth 0.6대 — 배경 트레이싱(0.5) 위, 격자(1) 아래. 비대화형(읽기전용 참조).
 *
 * 비동기 texture 로딩 패턴(_loadBgTexture 교훈 준수):
 *   - 레이어별 고유 key '__imglayer_<id>__'
 *   - 엔트리별 version 카운터 + textures.once('addtexture-'+key) 후 addBase64
 *   - destroy 안전: "참조 먼저 null, 그 다음 .destroy()"
 *
 * 표시 변환은 배경 트레이싱과 동일 규약:
 *   displaySize = (사이트 px) × scale, position = (offsetX, offsetY)
 */
const BASE_DEPTH = 0.6;

export class ImageLayerRenderer {
  constructor(scene) {
    this.scene = scene;
    /** Map<layerId, { img, version, dataUrl }> */
    this._objs = new Map();
  }

  _keyFor(id) {
    return '__imglayer_' + id + '__';
  }

  /**
   * 레이어 배열을 현재 상태에 맞게 동기화.
   * @param {Array} layers           imageLayerStore.layers
   * @param {number} siteWpx         사이트 가로 픽셀(월드)
   * @param {number} siteHpx         사이트 세로 픽셀(월드)
   */
  sync(layers, siteWpx, siteHpx) {
    const liveIds = new Set(layers.map((l) => l.id));

    // 1) 사라진 레이어 정리
    for (const id of Array.from(this._objs.keys())) {
      if (!liveIds.has(id)) this._disposeOne(id);
    }

    // 2) 각 레이어 (배열 순서 = 그리기 순서)
    layers.forEach((layer, idx) => {
      const depth = BASE_DEPTH + idx * 0.001; // 순서 유지(미세 depth)
      const entry = this._objs.get(layer.id);

      if (!entry || entry.dataUrl !== layer.dataUrl) {
        // 신규 또는 이미지 교체 → 비동기 (재)로드
        this._loadLayerTexture(layer, depth, siteWpx, siteHpx);
        return;
      }

      // 기존 객체 → 변환/표시만 갱신
      if (entry.img) {
        entry.img.setDepth(depth);
        this._applyTransform(entry.img, layer, siteWpx, siteHpx);
      }
    });
  }

  _loadLayerTexture(layer, depth, siteWpx, siteHpx) {
    const key = this._keyFor(layer.id);

    // 기존 객체 참조 먼저 끊기
    const prev = this._objs.get(layer.id);
    if (prev && prev.img) {
      const old = prev.img;
      prev.img = null;
      old.destroy();
    }
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);

    const version = ((prev && prev.version) || 0) + 1;
    this._objs.set(layer.id, { img: null, version, dataUrl: layer.dataUrl });

    this.scene.textures.once('addtexture-' + key, () => {
      const cur = this._objs.get(layer.id);
      if (!cur || cur.version !== version) return; // 더 새 로드로 대체됨
      const img = this.scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(depth);
      cur.img = img;
      this._applyTransform(img, layer, siteWpx, siteHpx);
    });
    this.scene.textures.addBase64(key, layer.dataUrl);
  }

  _applyTransform(img, layer, siteWpx, siteHpx) {
    // v0.5.1: scaleX/scaleY 분리 (구버전 scale 단일 값 폴백)
    const sx = layer.scaleX ?? layer.scale ?? 1;
    const sy = layer.scaleY ?? layer.scale ?? 1;
    img.setDisplaySize(siteWpx * sx, siteHpx * sy);
    img.setPosition(layer.offsetX, layer.offsetY);
    img.setVisible(layer.visible !== false);
    img.setAlpha(Math.max(0, Math.min(1, layer.opacity ?? 0.8)));
  }

  _disposeOne(id) {
    const entry = this._objs.get(id);
    if (entry && entry.img) {
      const obj = entry.img;
      entry.img = null;
      obj.destroy();
    }
    const key = this._keyFor(id);
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    this._objs.delete(id);
  }

  destroy() {
    for (const id of Array.from(this._objs.keys())) this._disposeOne(id);
    this._objs.clear();
  }
}
