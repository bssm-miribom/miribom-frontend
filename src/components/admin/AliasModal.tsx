import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { color, radius, type } from '@/constants/theme';
import { ApiError, createAlias, getAdminPlaces } from '@/lib/api';
import { useApi } from '@/lib/useApi';

type Props = { visible: boolean; onClose: () => void; onDone?: () => void };

/** A2 별칭 등록: '부캉이'처럼 새로 뜬 이름을 실제 장소에 연결 (부산시만) */
export function AliasModal({ visible, onClose, onDone }: Props) {
  const places = useApi(() => (visible ? getAdminPlaces() : Promise.resolve([])), [visible]);
  const [alias, setAlias] = useState('');
  const [filter, setFilter] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const list = (places.data ?? []).filter(
    (p) => !filter || p.name.includes(filter) || p.aliases.some((a) => a.includes(filter)),
  );
  const canSubmit = alias.trim() !== '' && placeId && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await createAlias({ alias: alias.trim(), place_id: placeId });
      const name = places.data?.find((p) => p.id === placeId)?.name ?? placeId;
      setMessage({ ok: true, text: `'${res.alias}'을(를) ${name}에 연결했습니다. ${res.applies_from} 판정부터 검색어에 반영됩니다.` });
      setAlias('');
      onDone?.();
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      setMessage({ ok: false, text: err?.status === 409 ? '이미 등록된 별칭입니다.' : (err?.detail ?? '등록하지 못했습니다.') });
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setMessage(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.head}>
            <AppText variant="h2">별칭 등록</AppText>
            <Pressable onPress={close} accessibilityLabel="닫기" style={styles.close}>
              <Icon name="clear" size={14} />
            </Pressable>
          </View>
          <AppText variant="bodySm" color={color.textSecondary}>
            새로 뜬 별칭을 실제 장소에 연결합니다. 등록하면 대시보드에 바로 표시되고, 다음 날 판정부터 검색어에 반영됩니다.
          </AppText>

          <View style={styles.field}>
            <AppText variant="caption" color={color.textSecondary}>
              별칭
            </AppText>
            <TextInput
              style={styles.input}
              value={alias}
              onChangeText={setAlias}
              placeholder="예: 부캉이"
              placeholderTextColor={color.textDisabled}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={color.textSecondary}>
              연결할 장소
            </AppText>
            <View style={[styles.input, styles.row]}>
              <Icon name="search" size={18} />
              <TextInput
                style={styles.inputText}
                value={filter}
                onChangeText={setFilter}
                placeholder="장소 이름으로 찾기"
                placeholderTextColor={color.textDisabled}
              />
            </View>
            <ScrollView style={styles.list}>
              {places.loading && <ActivityIndicator color={color.textLink} style={styles.pad} />}
              {list.map((p) => {
                const on = p.id === placeId;
                return (
                  <Pressable key={p.id} onPress={() => setPlaceId(p.id)} style={[styles.place, on && styles.placeOn]}>
                    <AppText variant="bodySm">{p.name}</AppText>
                    <AppText variant="caption" color={color.textSecondary} numberOfLines={1} style={styles.flex}>
                      {p.district}
                      {p.aliases.length ? ` · ${p.aliases.join(', ')}` : ''}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {message && (
            <AppText variant="bodySm" color={message.ok ? color.badgeNewText : '#A93320'}>
              {message.text}
            </AppText>
          )}

          <Pressable style={[styles.submit, !canSubmit && styles.disabled]} disabled={!canSubmit} onPress={submit}>
            {busy ? <ActivityIndicator color={color.textPrimary} /> : <AppText variant="h3">등록</AppText>}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(27,47,74,0.32)', alignItems: 'center', justifyContent: 'center' },
  sheet: {
    width: 480,
    maxWidth: '92%',
    gap: 16,
    padding: 28,
    borderRadius: radius.lg,
    backgroundColor: color.bgDefault,
    boxShadow: '0 8px 24px rgba(27,47,74,0.12)',
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.bgMuted, alignItems: 'center', justifyContent: 'center' },
  field: { gap: 8 },
  input: {
    ...type.body,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.md,
    color: color.textPrimary,
    outlineStyle: 'none',
  } as object,
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputText: { ...type.body, flex: 1, height: '100%', color: color.textPrimary, outlineStyle: 'none' } as object,
  list: { maxHeight: 220, borderWidth: 1, borderColor: color.borderDefault, borderRadius: radius.md },
  pad: { padding: 16 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  placeOn: { backgroundColor: color.bgBrandSubtle },
  flex: { flex: 1 },
  submit: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: color.bgBrand },
  disabled: { opacity: 0.6 },
});
