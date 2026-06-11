import { useEffect, useRef, useState } from 'react';
import { useRenameStore } from '../state/renameStore.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

/**
 * 맵 위 인라인 이름 편집 입력창 — v0.5.1 (대통령 요청 #2)
 *
 * GridCanvas 컨테이너(position: relative) 안에 절대 위치로 떠서
 * 더블클릭한 시설 라벨 자리에 input을 표시한다 (Finder rename UX).
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

  const w = Math.max(80, Math.min(240, target.width * 0.9));

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
        left: `${target.left + target.width / 2}px`,
        top: `${target.top + target.height / 2}px`,
        transform: 'translate(-50%, -50%)',
        width: `${w}px`,
        zIndex: 30,
        background: '#1a1a28',
        border: '1.5px solid #ffff66',
        borderRadius: '4px',
        color: '#ffffff',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '4px 6px',
        outline: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.55)',
        boxSizing: 'border-box',
      }}
    />
  );
}
