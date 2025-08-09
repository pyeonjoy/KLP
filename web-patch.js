// React Native Web shadow 경고 패치
if (typeof window !== 'undefined') {
  // console.warn을 가로채서 shadow 관련 경고만 필터링
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args[0];
    if (typeof message === 'string' && message.includes('shadow*" style props are deprecated')) {
      return; // shadow 관련 경고는 무시
    }
    originalWarn.apply(console, args);
  };
}
