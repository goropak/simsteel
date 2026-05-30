/**
 * 레이아웃 import 상태 (v0.2.8)
 *
 * 역할: siteBoundary 정보를 보관해 GridScene이 경계 박스를 렌더링할 수 있게 함.
 * 보안 (0조 부칙): import는 브라우저 내 FileReader 처리, 외부 전송 0.
 */
import { create } from 'zustand';

export const useImportStore = create((set) => ({
  /** siteBoundary: { wCells, hCells, offsetXCells, offsetYCells } | null */
  siteBoundary: null,
  /** importMeta: { name, worldSize: { wCells, hCells, cellMeters } } | null */
  importMeta: null,

  applyImport: (meta, boundary) => set({ importMeta: meta, siteBoundary: boundary }),
  clearImport: () => set({ siteBoundary: null, importMeta: null }),
}));
