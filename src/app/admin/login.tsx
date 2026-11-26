import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { AppText, Icon, Logo } from '@/components/ui';
import { icons } from '@/constants/icons';
import { color, radius, type } from '@/constants/theme';
import { ApiError, login, type OrgType } from '@/lib/api';
import { getLastLogoutReason } from '@/lib/session';

const ORGS: { value: OrgType; label: string }[] = [
  { value: 'city', label: '부산시' },
  { value: 'district', label: '구·군청' },
  { value: 'facility', label: '시설 관리기관' },
];


// A1 로그인 (기관 담당자 전용)
export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [org, setOrg] = useState<OrgType>('city');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(() => {
    const reason = getLastLogoutReason();
    if (reason === 'expired') return '로그인 시간이 지나 자동으로 로그아웃했습니다. 다시 로그인해 주세요.';
    if (reason === 'unauthorized') return '로그인이 풀렸습니다. 다시 로그인해 주세요.';
    return null;
  });

  const canSubmit = username.trim() !== '' && password !== '' && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setMessage(null);
    try {
      // 소속 선택은 안내용. 권한은 서버가 계정 기준으로 정함
      await login({ username: username.trim(), password });
      router.replace('/admin');
    } catch (e) {
      setMessage(e instanceof ApiError ? e.detail : '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.page}>
      {width >= 1024 && <BrandPanel onCitizen={() => router.push('/')} />}
      <ScrollView style={styles.formSide} contentContainerStyle={styles.formScroll}>
        <View style={styles.form}>
          <View style={styles.head}>
            <AppText variant="caption" color={color.textLink}>
              기관 계정 전용
            </AppText>
            <AppText variant="h1">관리자 로그인</AppText>
            <AppText variant="bodySm" color={color.textSecondary}>
              기관에서 발급받은 계정으로만 로그인할 수 있어요. 소속에 따라 볼 수 있는 장소와 메뉴가 달라요.
            </AppText>
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={color.textSecondary}>
              소속 기관
            </AppText>
            <View style={styles.segment} accessibilityRole="radiogroup">
              {ORGS.map((o) => {
                const on = o.value === org;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => setOrg(o.value)}
                    style={[styles.segItem, on && styles.segOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}>
                    <AppText variant={on ? 'h3' : 'bodySm'} color={on ? color.textPrimary : color.textSecondary}>
                      {o.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={color.textSecondary}>
              아이디
            </AppText>
            <View style={styles.input}>
              <TextInput
                style={styles.inputText}
                value={username}
                onChangeText={setUsername}
                placeholder="아이디를 입력하세요"
                placeholderTextColor={color.textDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                onSubmitEditing={submit}
              />
            </View>
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={color.textSecondary}>
              비밀번호
            </AppText>
            <View style={styles.input}>
              <TextInput
                style={styles.inputText}
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={color.textDisabled}
                secureTextEntry={!showPw}
                autoComplete="current-password"
                onSubmitEditing={submit}
              />
              <Pressable
                onPress={() => setShowPw((v) => !v)}
                accessibilityLabel={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                hitSlop={8}>
                <Icon name="eye" size={20} />
              </Pressable>
            </View>
          </View>

          {message && (
            <AppText variant="bodySm" color="#A93320">
              {message}
            </AppText>
          )}

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={[styles.submit, !canSubmit && styles.disabled]}
            accessibilityRole="button">
            {busy ? <ActivityIndicator color={color.textPrimary} /> : <AppText variant="h3">로그인</AppText>}
          </Pressable>

          <View style={styles.links}>
            <Pressable onPress={() => setMessage('비밀번호는 소속 기관 관리자에게 초기화를 요청해 주세요.')}>
              <AppText variant="bodySm" color={color.textLink} style={styles.underline}>
                비밀번호 찾기
              </AppText>
            </Pressable>
            <Pressable onPress={() => setMessage('계정 발급은 부산시 재난안전과에 요청해 주세요.')}>
              <AppText variant="bodySm" color={color.textLink} style={styles.underline}>
                기관 계정 발급 요청
              </AppText>
            </Pressable>
          </View>

          <View style={styles.perm}>
            <AppText variant="caption" color={color.textSecondary}>
              권한 안내
            </AppText>
            <View style={styles.permRow}>
              <AppText variant="bodySm" style={styles.permWho}>
                부산시
              </AppText>
              <AppText variant="bodySm" color={color.textSecondary} style={styles.flex}>
                전체 장소 조회 · 별칭 등록 등 입력 · 과거 사례 재현
              </AppText>
            </View>
            <View style={styles.permRow}>
              <AppText variant="bodySm" style={styles.permWho}>
                구·군청 · 시설 관리기관
              </AppText>
              <AppText variant="bodySm" color={color.textSecondary} style={styles.flex}>
                관할 장소만 조회 (입력 불가)
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BrandPanel({ onCitizen }: { onCitizen: () => void }) {
  return (
    <View style={styles.brand}>
      <Image source={icons.loginWave} style={styles.wave} contentFit="fill" />
      <View style={styles.brandTop}>
        <Logo height={40} />
        <AppText variant="label" color={color.bgBrand}>
          BEYOND ONLINE MONITORING
        </AppText>
      </View>

      <View style={styles.radar}>
        <Icon name="loginRadarOuter" size={240} style={styles.abs} />
        <Icon name="loginRadar2" size={150} style={[styles.abs, { left: 45, top: 45 }]} />
        <Icon name="loginRadar3" size={72} style={[styles.abs, { left: 84, top: 84 }]} />
        <Icon name="loginRadarDot" size={16} style={[styles.abs, { left: 112, top: 112 }]} />
      </View>

      <View style={styles.copy}>
        <AppText variant="caption" color={color.textLink}>
          부산 혼잡 조기 경보
        </AppText>
        <AppText variant="display">{'사람이 몰리기 전,\n온라인 관심을 먼저 봅니다.'}</AppText>
        <AppText variant="body" color={color.textSecondary}>
          {'네이버 검색량 급증을 매일 07:00에 판정해\n안전 인력과 교통을 미리 준비할 수 있게 돕습니다.'}
        </AppText>
      </View>

      <View style={styles.citizenCard}>
        <AppText variant="caption" color={color.textLink}>
          시민 · 관광객
        </AppText>
        <AppText variant="h3">{'로그인 없이 바로\n가려는 곳의 혼잡도를 확인하세요'}</AppText>
        <Pressable onPress={onCitizen} style={styles.citizenBtn} accessibilityRole="link">
          <AppText variant="h3">혼잡도 확인하기</AppText>
          <Icon name="arrowRight" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, flexDirection: 'row', backgroundColor: color.bgDefault },
  brand: { width: '52.8%', backgroundColor: color.bgBrandSubtle, overflow: 'hidden', minHeight: 760 },
  wave: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 420 },
  brandTop: { height: 172, paddingTop: 56, paddingLeft: 72, gap: 12, backgroundColor: color.bgInverse },
  radar: { position: 'absolute', top: 220, right: 50, width: 240, height: 240 },
  abs: { position: 'absolute', left: 0, top: 0 },
  copy: { marginTop: 128, marginLeft: 72, gap: 16 },
  citizenCard: {
    position: 'absolute',
    left: 72,
    bottom: 64,
    width: 448,
    gap: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: color.borderBrand,
    borderRadius: radius.lg,
    backgroundColor: color.bgDefault,
  },
  citizenBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 16,
    borderRadius: radius.md,
    backgroundColor: color.bgBrand,
  },
  formSide: { flex: 1 },
  formScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  form: { width: 400, maxWidth: '100%', gap: 24 },
  head: { gap: 8 },
  field: { gap: 8 },
  segment: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.md, backgroundColor: color.bgMuted },
  segItem: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent' },
  segOn: { backgroundColor: color.bgDefault, borderColor: color.borderBrand },
  input: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.md,
    backgroundColor: color.bgDefault,
  },
  inputText: { ...type.body, flex: 1, height: '100%', color: color.textPrimary, outlineStyle: 'none' } as object,
  submit: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: color.bgBrand },
  disabled: { opacity: 0.6 },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
  underline: { textDecorationLine: 'underline' },
  perm: { gap: 12, padding: 20, borderRadius: radius.lg, backgroundColor: color.bgSubtle },
  permRow: { flexDirection: 'row', gap: 16 },
  permWho: { width: 130 },
  flex: { flex: 1 },
});
