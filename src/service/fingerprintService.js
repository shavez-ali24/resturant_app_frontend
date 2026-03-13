import FingerprintJS from '@fingerprintjs/fingerprintjs';

const FINGERPRINT_KEY = 'app_fingerprint_id';

class FingerprintService {
  fpPromise = null;

  async getFingerprint() {
    // 1️⃣ Check localStorage first (MOST IMPORTANT)
    const storedId = localStorage.getItem(FINGERPRINT_KEY);
    if (storedId) {
      // console.log('Fingerprint (from localStorage):', storedId);
      return storedId;
    }

    // 2️⃣ Load FingerprintJS only once
    if (!this.fpPromise) {
      this.fpPromise = FingerprintJS.load({
        monitoring: false
      });
    }

    const fp = await this.fpPromise;
    const result = await fp.get();

    const visitorId = result.visitorId;

    // Log fingerprint to console
    // console.log('Fingerprint (newly generated):', visitorId);
    // console.log('Full fingerprint result:', result);

    // 3️⃣ Persist everywhere
    localStorage.setItem(FINGERPRINT_KEY, visitorId);
    this.setCookie(FINGERPRINT_KEY, visitorId, 365);

    return visitorId;
  }

  setCookie(name, value, days) {
    const expires = new Date(
      Date.now() + days * 864e5
    ).toUTCString();

    document.cookie =
      name +
      '=' +
      value +
      '; expires=' +
      expires +
      '; path=/; SameSite=Lax';
  }

  getStoredFingerprint() {
    return (
      localStorage.getItem(FINGERPRINT_KEY) ||
      this.getCookie(FINGERPRINT_KEY)
    );
  }

  getCookie(name) {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1];
  }
}

export default new FingerprintService();
