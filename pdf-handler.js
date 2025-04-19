// pdf-handler.js

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function () {
    const typedArray = new Uint8Array(reader.result);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    let inTransazioni = false;
    let righe = [];

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const textContent = await page.getTextContent();
      const items = textContent.items.map(item => item.str.trim());

      for (const riga of items) {
        if (riga.includes('TRANSAZIONI SUL CONTO') || riga.includes('DATA TIPO DESCRIZIONE IN ENTRATA IN USCITA SALDO')) {
          inTransazioni = true;
          continue;
        }
        if (riga.includes("PANORAMICA DEL SALDO") || riga.includes("NOTE SULL'ESTRATTO CONTO")) {
          inTransazioni = false;
        }
        if (inTransazioni && riga) {
          righe.push(riga);
        }
      }
    }

    const transazioni = segmentaTransazioni(righe);
    const normalizzate = transazioni.map(normalizza).filter(x => x !== null);
    const dati = [];
    normalizzate.forEach(t => {
      const importi = estraiImporti(t.Importi);
      if (importi.length < 1) return;

      let saldo = importi.length >= 2 ? importi[1] : (dati.length ? dati[dati.length - 1].Saldo : importi[0]);

      dati.push({
        Data: t.Data,
        Tipo: t.Tipo,
        Descrizione: t.Descrizione,
        Movimentazione: importi[0],
        Saldo: saldo
      });
    });

    for (let i = 0; i < dati.length; i++) {
      dati[i].Entrata = 0.0;
      dati[i].Uscita = 0.0;
      if (i === 0) {
        dati[i].Entrata = dati[i].Movimentazione;
      } else {
        const delta = +(dati[i].Saldo - dati[i - 1].Saldo).toFixed(2);
        if (delta > 0) dati[i].Entrata = delta;
        if (delta < 0) dati[i].Uscita = Math.abs(delta);
      }
    }

    creaTabella(dati);

    const posizioni = {};

    dati.forEach(d => {
      const isins = d.Descrizione.match(ISIN_REGEX);
      if (isins) {
        isins.forEach(isin => {
          if (!posizioni[isin]) posizioni[isin] = { totale: 0, descrizioni: [], nome: d.Descrizione };

          const match = d.Descrizione.match(/quantity:\s*([\d.,]+)/i);
          let quantita = 0;
          if (match) quantita = parseFloat(match[1].replace(',', '.'));

          let descrizionePulita = d.Descrizione.split(isin)[0].trim();

          posizioni[isin].totale += quantita;
          posizioni[isin].descrizioni.push({
            data: d.Data,
            descrizione: descrizionePulita,
            quantita,
            soldi: d.Movimentazione
          });
        });
      }
    });

    const isinToNome = {};
    Object.entries(posizioni).forEach(([isin, info]) => {
      const matchNome = info.nome.match(/(\w{12})(.*?),\s*quantity/);
      if (matchNome) {
        isinToNome[isin] = matchNome[2].trim();
      }
    });

    const cashDividends = [];

    Object.entries(posizioni).forEach(([isin, info]) => {
      const descrizioni = info.descrizioni || [];

      const nonCashDividends = [];
      const cashDividendsForThisIsin = [];

      descrizioni.forEach(entry => {
        if (entry.descrizione.startsWith("Cash Dividend")) {
          cashDividendsForThisIsin.push({
            isin,
            nome: isinToNome[isin] || isin,
            ...entry
          });
        } else {
          nonCashDividends.push(entry);
        }
      });

      posizioni[isin].descrizioni = nonCashDividends;
      cashDividends.push(...cashDividendsForThisIsin);
    });

    mostraDividendi(cashDividends);

    const posContainer = document.getElementById('positionsContainer');
    posContainer.innerHTML = "";
    Object.entries(posizioni).forEach(([isin, info]) => {
      const nomeAzione = isinToNome[isin] || isin;
      const totalInvestito = info.descrizioni.reduce((acc, x) => acc + x.soldi, 0);
      const quantitaTotale = info.totale;

      const card = document.createElement('div');
      card.classList.add('card');

      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">📌 ${nomeAzione}</h5>

          <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div style="flex: 1 1 200px;"><strong>Quantità totale:</strong><br>${quantitaTotale.toFixed(6)}</div>
            <div style="flex: 1 1 200px;"><strong>Soldi investiti:</strong><br>${totalInvestito.toFixed(2)} €</div>
            <div style="flex: 1 1 200px;"><strong>Valore attuale:</strong><br><span id="valore-attuale-${isin}">—</span></div>
            <div style="flex: 1 1 200px;"><strong>Variazione (€):</strong><br><span id="var-euro-${isin}">—</span></div>
            <div style="flex: 1 1 200px;"><strong>Variazione (%):</strong><br><span id="var-percent-${isin}">—</span></div>
          </div>

          <div style="overflow-x: auto;">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Quantità</th>
                  <th>Descrizione</th>
                  <th>Valore</th>
                  <th>Variazione (€)</th>
                  <th>Variazione (%)</th>
                </tr>
              </thead>
              <tbody>
                ${info.descrizioni.map(item => `
                  <tr>
                    <td>${item.data}</td>
                    <td>${item.quantita.toFixed(6)}</td>
                    <td>${item.descrizione}</td>
                    <td>${item.soldi.toFixed(2)} €</td>
                    <td class="variazione-euro-${isin}">N/A</td>
                    <td class="variazione-percentuale-${isin}">N/A</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;

      posContainer.appendChild(card);
    });

    const priceContainer = document.getElementById('priceRequestsContainer');
    priceContainer.innerHTML = "";
    Object.entries(posizioni).forEach(([isin, info]) => {
      const nome = isinToNome[isin] || isin;
      const inputPrezzo = creaInputPrezzo(isin, nome);
      priceContainer.appendChild(inputPrezzo);
    });
  };

  reader.readAsArrayBuffer(file);
});
