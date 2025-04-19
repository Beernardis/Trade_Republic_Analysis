const PAROLE_CHIAVE_NON_VALIDE = [
  'Trade Republic', 'Brunnenstraße', 'Berlin', 'www.traderepublic.com',
  'Sede centrale', 'AG Charlottenburg', 'PARTITA IVA', 'Direttore Generale',
  'Andreas Torner', 'Christian Hecker', 'Thomas Pischke', 'Gernot Mittendorfer',
  'Generato il', 'Pagina', 'DATA', 'TIPO', 'DESCRIZIONE'
];

const ISIN_REGEX = /\b[A-Z]{2}[A-Z0-9]{10}\b/g;

/**
 * Verifica se una stringa è una data in formato "12 gen", "9 mar", ecc.
 */
function èData(val) {
  return /^\d{1,2} [a-z]{3}$/i.test(val);
}

/**
 * Determina se una transazione è valida in base a parole chiave da escludere.
 */
function transazioneValida(t) {
  const testo = t.join(" ");
  return !PAROLE_CHIAVE_NON_VALIDE.some(p => testo.includes(p));
}

/**
 * Estrae e normalizza importi monetari da una lista di stringhe tipo "123,45 €"
 */
function estraiImporti(importi_raw) {
  const numeri = [];
  for (let item of importi_raw) {
    const parti = item.split('€');
    for (let p of parti) {
      p = p.trim();
      if (p) {
        const parsed = parseFloat(p.replaceAll('.', '').replace(',', '.'));
        if (!isNaN(parsed)) numeri.push(parsed);
      }
    }
  }
  return numeri;
}
