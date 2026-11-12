import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { GripVertical, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandBar } from '../../components/BrandBar';
import { useAction, useToast } from '../../components/toast';
import { Button, Lead, Screen, Small, Title, TopBar } from '../../components/ui';
import { mediaSource } from '../../lib/format';
import { useSession } from '../../lib/session';
import { colors, fonts, radius } from '../../theme';

const MAX = 6;

/** Фото анкеты: от 1 до 6, первое — обложка. Нажатие на фото делает его обложкой. */
export default function Photos() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { api, me, apiUrl, demo, refreshMe } = useSession();
  const toast = useToast();
  const action = useAction();
  const [uploading, setUploading] = useState(false);
  const photos = me?.profile?.photos ?? [];

  const add = async () => {
    if (photos.length >= MAX) return toast('Можно добавить не больше 6 фото');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return toast('Разреши доступ к фото в настройках телефона', 'error');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.75,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) return toast('Фото должно быть не больше 5 МБ', 'error');
    const mimeType = asset.mimeType && /image\/(jpeg|png|webp)/.test(asset.mimeType) ? asset.mimeType : 'image/jpeg';
    setUploading(true);
    try {
      await api.uploadPhoto({ uri: asset.uri, mimeType, fileName: asset.fileName ?? `photo.${mimeType.split('/')[1]}` });
      await refreshMe();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const remove = action(async (id: string) => {
    await api.removePhoto(id);
    await refreshMe();
  });

  const makeCover = action(async (id: string) => {
    if (photos[0]?.id === id) return;
    await api.reorderPhotos([id, ...photos.filter((p) => p.id !== id).map((p) => p.id)]);
    await refreshMe();
    toast('Обложка обновлена');
  });

  const done = () => {
    if (!photos.length) {
      toast('Добавь хотя бы одно фото — без него анкета не появится в ленте');
      return;
    }
    if (edit) router.back();
    else router.replace('/feed');
  };

  const tiles = Array.from({ length: MAX }, (_, i) => photos[i] ?? null);

  return (
    <Screen
      header={edit ? <TopBar back /> : <BrandBar filters={false} />}
      blobTop={56}
      footer={<Button title="Готово" onPress={done} />}
    >
      <Title>Добавь фото</Title>
      <Lead style={{ marginBottom: 16 }}>Покажи, какой ты в жизни. От 1 до 6 фото.</Lead>
      <View style={styles.grid}>
        {tiles.map((photo, i) => {
          if (photo) {
            const source = mediaSource(photo.storageKey, apiUrl);
            return (
              <Pressable key={photo.id} style={styles.tile} onPress={() => makeCover(photo.id)} accessibilityLabel={i === 0 ? 'Обложка' : 'Сделать обложкой'}>
                {source ? <Image source={source} style={styles.image} /> : <View style={[styles.image, { backgroundColor: colors.line }]} />}
                <Pressable style={styles.remove} onPress={() => remove(photo.id)} hitSlop={8} accessibilityLabel="Удалить фото">
                  <X color={colors.ink} size={16} strokeWidth={3} />
                </Pressable>
                {i === 0 && <View style={styles.cover}><Text style={styles.coverText}>Обложка</Text></View>}
              </Pressable>
            );
          }
          const first = i === photos.length;
          return (
            <Pressable key={`empty-${i}`} style={[styles.tile, styles.empty]} onPress={add} disabled={uploading || !first} accessibilityLabel="Добавить фото">
              {uploading && first ? <ActivityIndicator color={colors.red} /> : (
                <>
                  <Plus color={colors.red} size={30} />
                  <Text style={styles.addText}>Добавить{'\n'}фото</Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.hint}>
        <GripVertical color={colors.red} size={20} />
        <Text style={styles.hintText}>Нажми на фото, чтобы сделать его обложкой</Text>
      </View>
      {demo && <Small style={{ textAlign: 'center', marginTop: 10 }}>В деморежиме фото остаются только на телефоне.</Small>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31%', aspectRatio: 0.72, borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  empty: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.red, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  addText: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13, textAlign: 'center', marginTop: 4 },
  remove: {
    position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  cover: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(36,22,18,0.75)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  coverText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
  hint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, alignSelf: 'center',
    backgroundColor: colors.paper, borderRadius: 20, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 8,
  },
  hintText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
});
