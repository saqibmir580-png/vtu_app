import { Linking, Alert } from 'react-native';

export const openYouTubeVideo = async (youtubeVideoId: string) => {
  if (!youtubeVideoId) return;

  const appUrl = `vnd.youtube:${youtubeVideoId}`;
  const webUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

  try {
    const supported = await Linking.canOpenURL(appUrl);
    if (supported) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    try {
      await Linking.openURL(webUrl);
    } catch (err) {
      Alert.alert('Cannot Open Video', 'Could not open YouTube link. Please check your internet connection.');
    }
  }
};

export const openYouTubePlaylist = async (playlistUrl?: string, playlistId?: string) => {
  const targetId = playlistId || (playlistUrl?.includes('list=') ? playlistUrl.split('list=')[1].split('&')[0] : '');
  const appUrl = targetId ? `vnd.youtube://www.youtube.com/playlist?list=${targetId}` : '';
  const webUrl = playlistUrl || (targetId ? `https://www.youtube.com/playlist?list=${targetId}` : '');

  if (!webUrl) return;

  try {
    if (appUrl) {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
        return;
      }
    }
    await Linking.openURL(webUrl);
  } catch (err) {
    await Linking.openURL(webUrl);
  }
};
