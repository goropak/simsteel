import { useEffect, useRef, useState } from 'react';
import { useRenameStore } from '../state/renameStore.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

/**
 * 맵 위 인라인 이름 편집 — v0.5.1 (대통령 요청 #2)
 *
 * 별도 박스가 아니라 시설 라벨 "그 자리"를 덮는 작은 입력칸 (Finder rename UX).
 * GridCanvas 컨테이너(position: relative) 기준 절대 위치 — GridScene이
 * 더블클릭 시 시설 중앙의 화면 좌표(centerX/centerY)를 계산해 연다.
 *
 * 동작: Enter/외부 클릭(blur) = 확정 · Esc = 취소 · 휠 줌 = 확정 후 닫기
 * (카메라가 움직이면 오버레이 위치가 어긋나므로 휠 발생 시 즉시 커밋).
 */
export default function InlineRenameInput() {
  const target = useRenameStore((s) => s.target);
  const closeRename = useRenameStore((s) => s.closeRename);

  if (!target) return null;
  return <RenameBox key={target.facId} target={target} close={closeRename} />;
}

function RenameBox({ target, close }) {
  const [value, setValue] = useState(target.name);
  const inputRef = useRef(null);
  const doneRef = useRef(false); // commit/cancel 1회 보장

  const commit = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const next = value.trim();
    if (next && next !== target.name) {
      useFacilitiesStore.getState().updateFacility(target.facId, { name: next });
    }
    close();
  };

  const cancel = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    close();
  };

  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.focus(); el.select(); }
    // 휠(줌/스크롤) 시 오버레이 위치가 어긋남 → 즉시 확정 후 닫기
    const onWheel = () => commit();
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 시설 폭에 맞춘 작은 입력칸 (라벨을 그대로 덮는 느낌)
  const w = Math.max(72, Math.min(200, target.width * 0.8));

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation(); // Phaser/전역 단축키로 전파 차단
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') cancel();
      }}
      maxLength={60}
      style={{
        position: 'absolute',
        left: `${target.centerX}px`,
        top: `${target.centerY}px`,
        transform: 'translate(-50%, -50%)',
        width: `${w}px`,
        zIndex: 30,
        background: 'rgba(20, 18, 10, 0.92)',
        border: '1px solid #ffff66',
        borderRadius: '3px',
        color: '#ffffff',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '2px 4px',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}
