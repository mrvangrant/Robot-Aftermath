class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.musicVolume = 0.5;
    this.sfxVolume = 1.0;
  }

  loadSound(name, path) {
    this.sounds[name] = path;
  }

  playSound(name, volume = this.sfxVolume) {
    if (this.sounds[name]) {
      try {
        const sound = new Audio(this.sounds[name]);
        sound.volume = Math.max(0, Math.min(1, volume));
        sound.play().catch((err) => console.log("Audio play failed:", err));
      } catch (err) {
        console.log("Error playing sound:", err);
      }
    } else {
      console.warn(`Sound "${name}" not found`);
    }
  }

  playMusic(path, loop = true) {
    if (this.music) {
      this.music.pause();
    }
    this.music = new Audio(path);
    this.music.loop = loop;
    this.music.volume = this.musicVolume;
    this.music.play().catch((err) => console.log("Music play failed:", err));
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = volume;
    if (this.music) this.music.volume = volume;
  }

  setSfxVolume(volume) {
    this.sfxVolume = volume;
  }
}

export default new SoundManager();
