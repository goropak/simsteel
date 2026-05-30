import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GridScene } from '../phaser/GridScene.js';
import { GRID_CONFIG, GRID_COLORS } from '../phaser/config.js';

/**
 * Phaser 캔버스 래퍼 컴포넌트.
 *
 * 핵심 제약:
 *   Phaser의 포인터 좌표 계산은 canvas.getBoundingClientRect() 기반이다.
 *   캔버스가 이동·리사이즈 될 때마다 scale.updateBounds()를 호출해야
 *   hitTest·줌 앵커·배치 좌표가 정확해진다.
 *   → ResizeObserver로 컨테이너 크기 변화를 즉시 감지하여 처리한다.
 *   → FacilityEditor 패널이 열릴 때처럼 레이아웃이 변하는 경우도 자동 대응.
 */
export default function GridCanvas({ onCoordUpdate, onZoomUpdate }) {
  const containerRef = useRef(null);
  const gameRef      = useRef(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const container = containerRef.current;

    const scene = new GridScene();
    scene.onCoordUpdate = onCoordUpdate;
    scene.onZoomUpdate  = onZoomUpdate;

    const bgHex = '#' + GRID_COLORS.background.toString(16).padStart(6, '0');

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width:  container.clientWidth  || window.innerWidth,
      height: container.clientHeight || (window.innerHeight - 80),
      backgroundColor: bgHex,
      scene: scene,
      input: {
        mouse:    { preventDefaultWheel: true },
        keyboard: true,
      },
      render: {
        antialias: false,
      },
    });

    gameRef.current = game;

    /**
     * 컨테이너 크기/위치가 바뀔 때 Phaser를 동기화한다.
     * - resize(): 캔버스 픽셀 크기 갱신
     * - updateBounds(): canvas.getBoundingClientRect() 재계산
     *   (이게 없으면 포인터 좌표 오프셋이 틀어짐)
     */
    const syncBounds = () => {
      if (!gameRef.current || !container) return;
      game.scale.resize(container.clientWidth, container.clientHeight);
      game.scale.updateBounds();
    };

    // ResizeObserver: 컨테이너 자체의 크기 변화 감지
    // (window resize뿐 아니라 사이드패널 열림/닫힘, flex 재계산 등 모두 캡처)
    const ro = new ResizeObserver(syncBounds);
    ro.observe(container);

    // 초기 레이아웃 정착 후 한 번 더 동기화 (flex 레이아웃 안정화 대기)
    setTimeout(syncBounds, 150);

    return () => {
      ro.disconnect();
      game.destroy(true);
      gameRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    />
  );
}
