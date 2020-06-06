import videojs from 'video.js';
import path from 'path';

// Default options for the plugin.
const defaults = {};

// Cross-compatibility for Video.js 5 and 6.
const registerPlugin = videojs.registerPlugin || videojs.plugin;
// const dom = videojs.dom || videojs;

const MEDIA_SESSION_EXISTS = Boolean(navigator.mediaSession);

const SKIP_TIME = 10;

/**
 * Function to invoke when the player is ready.
 */
const onPlayerReady = (player, options) => {
  if (!MEDIA_SESSION_EXISTS) {
    videojs.log.warn(`Media Session is not available on this device.
                      Please try Chrome for Android 57`);
    return;
  }

  setUpSkips(player);

  if (player.playlist) {
    setUpPlaylist(player)
  }

  player.on('loadstart', () => updateMediaSession(player));
  updateMediaSession(player);
  player.addClass('vjs-media-session');

};

const updateMediaSession = (player) => {
  let curSrc;

  if (player.playlist) {
    const playlist = player.playlist();
    curSrc = Object.assign({}, playlist[player.playlist.currentItem()]);
  } else {
    curSrc = Object.assign({}, player.currentSource());
  }

  curSrc.title = curSrc.name;

  if (!curSrc.artwork) {
    const poster = player.poster();

    if (curSrc.thumbnail) {
      curSrc.artwork = curSrc.thumbnail.map((thumb) => ({
        src: thumb.srcset || thumb.src,
        type: thumb.type || path.extname(thumb.src).slice(1)
      }));
    } else if (poster) {
      curSrc.artwork = [{
        src: poster,
        type: 'image/' + path.extname(poster).slice(1)
      }];
    }
  }

  curSrc.src = player.currentSrc();
  navigator.mediaSession.metadata = new MediaMetadata(curSrc);
};

const setUpSkips = (player) => {
  navigator.mediaSession.setActionHandler('seekbackward', function() {
    player.currentTime(player.currentTime() - SKIP_TIME);
  });
  navigator.mediaSession.setActionHandler('seekforward', function() {
    player.currentTime(player.currentTime() + SKIP_TIME);
  });
};

const setUpPlaylist = (player) => {
  navigator.mediaSession.setActionHandler('previoustrack', function() {
    player.playlist.previous();
  });
  navigator.mediaSession.setActionHandler('nexttrack', function() {
    player.playlist.next();
  });
};

const mediaSession = function(options) {
  this.ready(() => {
    onPlayerReady(this, videojs.mergeOptions(defaults, options));
  });
};

// Register the plugin with video.js.
registerPlugin('mediaSession', mediaSession);

// Include the version number.
mediaSession.VERSION = '__VERSION__';

export default mediaSession;
