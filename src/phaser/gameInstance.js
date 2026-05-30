/**
 * Phaser game 인스턴스 싱글톤 — PNG 캡처 접근용.
 * GridCanvas가 게임 생성 후 setGame()을 호출한다.
 * SaveLoadPanel에서 getGame()으로 접근하여 canvas.toDataURL() 실행.
 */
let _game = null;
export const setGame = (g) => { _game = g; };
export const getGame = () => _game;
