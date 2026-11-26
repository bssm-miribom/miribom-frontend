import 'react-native';

// react-native-web이 Pressable 상태에 넣어 주는 hovered (웹 관리자 화면 호버 표시용)
declare module 'react-native' {
  interface PressableStateCallbackType {
    hovered?: boolean;
  }
}
