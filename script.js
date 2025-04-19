function creaInputPrezzo(isin, nome) {
  const div = document.createElement('div');
  div.classList.add('row', 'align-items-center', 'py-2', 'mb-1', 'input-row');

  div.innerHTML = `
    <div class="col-md-6 col-sm-12">
      <label for="price-${isin}" class="form-label mb-0"><strong>${nome}</strong></label>
    </div>
    <div class="col-md-4 col-sm-8 mt-2 mt-sm-0">
      <input type="number" class="form-control form-control-sm" id="price-${isin}" placeholder="Prezzo unitario (€)" step="0.01" />
    </div>
    <div class="col-md-2 col-sm-4 mt-2 mt-sm-0">
      <button class="btn btn-sm btn-primary w-100" type="button" id="confirm-${isin}">Conferma</button>
    </div>
  `;

  setTimeout(() => {
    const confirmBtn = div.querySelector(`#confirm-${isin}`);
    const inputPrezzo = div.querySelector(`#price-${isin}`);

    confirmBtn.addEventListener('click', () => {
      const prezzo = parseFloat(inputPrezzo.value);
      if (isNaN(prezzo)) return;

      const celleValore = document.querySelectorAll(`.variazione-euro-${isin}`);
      const cellePercentuale = document.querySelectorAll(`.variazione-percentuale-${isin}`);

      let sommaVariazioneEuro = 0;
      let sommaValoreOriginale = 0;
      let sommaValoreAttuale = 0;

      celleValore.forEach((cell, index) => {
        const tr = cell.closest('tr');
        const quantita = parseFloat(tr.children[1].textContent);
        const valoreOriginale = parseFloat(tr.children[3].textContent.replace('€', '').trim());
        const valoreAttuale = quantita * prezzo;

        const variazioneEuro = valoreAttuale - valoreOriginale;
        const variazionePercentuale = (variazioneEuro / valoreOriginale) * 100;

        sommaVariazioneEuro += variazioneEuro;
        sommaValoreOriginale += valoreOriginale;
        sommaValoreAttuale += valoreAttuale;

        const freccia = variazioneEuro >= 0
          ? `<span style="color:green;">▲</span>`
          : `<span style="color:red;">▼</span>`;

        const colore = variazioneEuro >= 0 ? 'green' : 'red';

        cell.innerHTML = `<span style="color:${colore};">${variazioneEuro.toFixed(2)} €</span>`;
        cellePercentuale[index].innerHTML = `<span style="color:${colore};">${variazionePercentuale.toFixed(2)}% ${freccia}</span>`;
      });

      const variazionePercentualeTotale = (sommaVariazioneEuro / sommaValoreOriginale) * 100;
      const frecciaTotale = sommaVariazioneEuro >= 0
        ? `<span style="color:green;">▲</span>`
        : `<span style="color:red;">▼</span>`;
      const coloreTotale = sommaVariazioneEuro >= 0 ? 'green' : 'red';

      document.getElementById(`valore-attuale-${isin}`).innerHTML = `${sommaValoreAttuale.toFixed(2)} €`;
      document.getElementById(`var-euro-${isin}`).innerHTML = `<span style="color:${coloreTotale};">${sommaVariazioneEuro.toFixed(2)} €</span>`;
      document.getElementById(`var-percent-${isin}`).innerHTML = `<span style="color:${coloreTotale};">${variazionePercentualeTotale.toFixed(2)}% ${frecciaTotale}</span>`;

      // Aggiorna il placeholder e disabilita l'input
      inputPrezzo.placeholder = `Prezzo confermato: ${prezzo.toFixed(2)} €`;
      inputPrezzo.value = '';
    });
  });

  return div;
}
