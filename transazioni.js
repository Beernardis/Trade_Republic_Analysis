// transazioni.js

function segmentaTransazioni(lista) {
  const transazioni = [];
  let corrente = [];
  for (const riga of lista) {
    if (èData(riga)) {
      if (corrente.length && transazioneValida(corrente)) transazioni.push([...corrente]);
      corrente = [riga];
    } else {
      corrente.push(riga);
      if (corrente.filter(x => x.includes('€')).length >= 2) {
        if (transazioneValida(corrente)) transazioni.push([...corrente]);
        corrente = [];
      }
    }
  }
  if (corrente.length && transazioneValida(corrente)) transazioni.push([...corrente]);
  return transazioni;
}

function normalizza(t) {
  if (t.length < 4) return null;

  const data = t[0] + " " + t[1];
  const monetari = t.filter(x => x.includes('€'));
  const idxMonetari = t.length - monetari.length;
  let tipo = t[2];
  let descrizione = t.slice(3, idxMonetari);

  if (t[2] === 'Transazione con') {
    tipo = 'Transazione con carta';
    descrizione = t.slice(4, idxMonetari);
  } else if (t[2] === 'Pagamento degli') {
    tipo = 'Pagamento degli interessi';
    descrizione = t.slice(4, idxMonetari);
  } else if (t[2] === 'Bonifico SEPA') {
    tipo = 'Bonifico SEPA istantaneo';
    descrizione = t.slice(4, idxMonetari);
  }

  return {
    Data: data,
    Tipo: tipo,
    Descrizione: descrizione.join(' ').trim(),
    Importi: monetari
  };
}

function creaTabella(dati) {
  const container = document.getElementById('tabella');
  let html = `<table class="table table-bordered">
    <thead>
      <tr>
        <th>Data</th>
        <th>Tipo</th>
        <th>Descrizione</th>
        <th>Entrata</th>
        <th>Uscita</th>
        <th>Saldo</th>
      </tr>
    </thead>
    <tbody>`;
  dati.forEach(d => {
    html += `<tr>
      <td>${d.Data}</td>
      <td>${d.Tipo}</td>
      <td>${d.Descrizione}</td>
      <td>${d.Entrata.toFixed(2)} €</td>
      <td>${d.Uscita.toFixed(2)} €</td>
      <td>${d.Saldo.toFixed(2)} €</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function mostraDividendi(dividendi) {
  const container = document.getElementById('dividendiContainer');
  if (!dividendi.length) {
    container.innerHTML = "<p>Nessun dividendo trovato.</p>";
    return;
  }

  let html = `
    <table class="table table-striped table-bordered">
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrizione</th>
          <th>Importo</th>
        </tr>
      </thead>
      <tbody>`;

  dividendi.forEach(d => {
    html += `
      <tr>
        <td>${d.data}</td>
        <td>${d.descrizione.split("ISIN")[0].trim()} ${d.nome}</td>
        <td>${d.soldi.toFixed(2)} €</td>
      </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}