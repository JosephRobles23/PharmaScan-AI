// Text-to-Speech utility for Spanish voice feedback

export function speak(text: string, lang: string = 'es-ES'): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not available');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(
        (voice) => voice.lang.startsWith('es') && voice.localService
    );

    if (spanishVoice) {
        utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
}

// Predefined messages
export const voiceMessages = {
    unitRegistered: (count: number) =>
        `Unidad registrada. Total: ${numberToWords(count)} ${count === 1 ? 'unidad' : 'unidades'}.`,
    productExpiringSoon: 'Atención: El producto está próximo a vencer.',
    productExpired: 'Advertencia: El producto está vencido.',
    productValid: 'Producto válido.',
    scanError: 'Error en el escaneo. Por favor, intente de nuevo.',
    productFinalized: (name: string, count: number) =>
        `Producto ${name} finalizado con ${numberToWords(count)} ${count === 1 ? 'unidad' : 'unidades'}.`,
} as const;

// Convert numbers to Spanish words (1-100)
function numberToWords(n: number): string {
    const ones = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const twenties = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];

    if (n === 0) return 'cero';
    if (n === 1) return 'una';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 30) return twenties[n - 20];
    if (n === 100) return 'cien';

    if (n < 100) {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        if (one === 0) return tens[ten];
        return `${tens[ten]} y ${ones[one]}`;
    }

    return n.toString();
}
