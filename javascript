// Definujeme globální proměnnou pro ukládání položek
var fakturaPolozky = [];

// Proměnná pro kontrolu, zda již stránka byla načtena
var pageAlreadyLoaded = false;

// Kontrola existence elementu
function checkElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element s ID '${id}' nebyl nalezen!`);
        return false;
    }
    return true;
}

// Funkce spuštěná po načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    // Ochrana proti opakovanému načtení
    if (pageAlreadyLoaded) {
        return;
    }
    pageAlreadyLoaded = true;
    
    console.log("DOM plně načten, inicializuji aplikaci...");
    
    // Kontrola, že jsme na správné stránce
    if (!document.getElementById('faktura-app')) {
        console.log("Aplikace faktur není na této stránce");
        return;
    }
    
    try {
        // Ověříme responzivní design a nastavíme třídu pro mobilní zařízení
        checkResponsiveDesign();
        
        // Nastavení dnešního data
        setDefaultDates();
        
        // Inicializace prázdné tabulky položek
        renderPolozkyTable();
        
        // Připojení událostí k tlačítkům
        connectEvents();
        
        // Přidáme posluchač na změnu velikosti okna
        window.addEventListener('resize', checkResponsiveDesign);
        
        console.log("Aplikace inicializována");
    } catch (error) {
        console.error("Chyba při inicializaci aplikace:", error);
    }
});

// Kontrola responzivního designu a přepnutí na mobilní zobrazení
function checkResponsiveDesign() {
    const app = document.getElementById('faktura-app');
    if (window.innerWidth <= 768) {
        app.classList.add('faktura-mobile');
    } else {
        app.classList.remove('faktura-mobile');
    }
}

// Připojení událostí k tlačítkům
function connectEvents() {
    // Kontrola existence všech důležitých elementů
    const requiredElements = [
        'btn-add-polozka', 'btn-preview', 'btn-download-pdf',
        'modal-polozka-close', 'btn-polozka-cancel', 'btn-polozka-save',
        'modal-preview-close', 'btn-preview-close',
        'polozka-cena-s-dph-toggle', 'polozka-cena', 'polozka-dph', 'polozka-mnozstvi',
        'faktura-zpusob-uhrady'
    ];

    let allElementsExist = true;
    requiredElements.forEach(id => {
        if (!checkElement(id)) {
            allElementsExist = false;
        }
    });

    if (!allElementsExist) {
        console.error("Některé elementy chybí! Události nebyly připojeny.");
        return;
    }
    
    // Základní tlačítka
    document.getElementById('btn-add-polozka').addEventListener('click', function(e) {
        e.preventDefault();
        showAddPolozkaModal();
    });
    
    document.getElementById('btn-preview').addEventListener('click', function(e) {
        e.preventDefault();
        showPreviewModal();
    });
    
    document.getElementById('btn-download-pdf').addEventListener('click', function(e) {
        e.preventDefault();
        downloadInvoiceAsPDF();
    });
    
    // Tlačítka v modálním okně položky
    document.getElementById('modal-polozka-close').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modal-polozka').classList.remove('active');
    });
    
    document.getElementById('btn-polozka-cancel').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modal-polozka').classList.remove('active');
    });
    
    document.getElementById('btn-polozka-save').addEventListener('click', function(e) {
        e.preventDefault();
        savePolozka();
    });
    
    // Tlačítka v modálním okně náhledu
    document.getElementById('modal-preview-close').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modal-preview').classList.remove('active');
    });
    
    document.getElementById('btn-preview-close').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modal-preview').classList.remove('active');
    });
    
    // Delegace událostí pro tlačítka v položkách
    document.addEventListener('click', function(e) {
        // Najdeme nejbližší tlačítko (pro případ, že bylo kliknuto na ikonu uvnitř tlačítka)
        const button = e.target.closest('.btn-edit-polozka, .btn-delete-polozka');
        
        if (button) {
            e.preventDefault();
            const id = button.getAttribute('data-id');
            
            if (button.classList.contains('btn-edit-polozka')) {
                editPolozka(id);
            }
            
            if (button.classList.contains('btn-delete-polozka')) {
                deletePolozka(id);
            }
        }
    });
    
    // Přepínač pro zadávání ceny s DPH
    document.getElementById('polozka-cena-s-dph-toggle').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('polozka-cena-label').textContent = 'Cena za m.j. s DPH';
        } else {
            document.getElementById('polozka-cena-label').textContent = 'Cena za m.j. bez DPH';
        }
        updateCalculatedValues();
    });
    
    // Aktualizace při změně ceny nebo DPH
    document.getElementById('polozka-cena').addEventListener('input', updateCalculatedValues);
    document.getElementById('polozka-dph').addEventListener('change', updateCalculatedValues);
    document.getElementById('polozka-mnozstvi').addEventListener('input', updateCalculatedValues);
}

// Nastavení výchozích dat
function setDefaultDates() {
    const today = new Date();
    const todayFormatted = formatDateForInput(today);
    
    document.getElementById('faktura-datum-vystaveni').value = todayFormatted;
    document.getElementById('faktura-datum-plneni').value = todayFormatted;
    
    // Datum splatnosti za 14 dní
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 14);
    document.getElementById('faktura-datum-splatnosti').value = formatDateForInput(dueDate);
}

// Formátování data pro input (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Formátování data pro zobrazení (DD.MM.YYYY)
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Formátování částky
function formatCurrency(amount) {
    return parseFloat(amount).toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kč';
}

// Zobrazení notifikace
function showFakturaNotification(message, type = 'success') {
    const notification = document.getElementById('faktura-notification');
    notification.textContent = message;
    notification.className = `faktura-notification active faktura-notification-${type}`;
    
    // Automatické skrytí notifikace po 3 sekundách
    setTimeout(function() {
        notification.classList.remove('active');
    }, 3000);
}

// Zobrazení loaderu
function showFakturaLoader() {
    document.getElementById('faktura-loader').style.display = 'flex';
}

// Skrytí loaderu
function hideFakturaLoader() {
    document.getElementById('faktura-loader').style.display = 'none';
}

// Výpočet ceny bez DPH z ceny s DPH
function calculatePriceWithoutVAT(priceWithVAT, vatRate) {
    return priceWithVAT / (1 + vatRate / 100);
}

// Výpočet ceny s DPH z ceny bez DPH
function calculatePriceWithVAT(priceWithoutVAT, vatRate) {
    return priceWithoutVAT * (1 + vatRate / 100);
}

// Aktualizace vypočtených hodnot v modálním okně položky
function updateCalculatedValues() {
    const cenaInput = document.getElementById('polozka-cena');
    const cenaSDphToggle = document.getElementById('polozka-cena-s-dph-toggle');
    const dphSelect = document.getElementById('polozka-dph');
    const mnozstviInput = document.getElementById('polozka-mnozstvi');
    
    const cenaValue = parseFloat(cenaInput.value) || 0;
    const dphValue = parseInt(dphSelect.value) || 0;
    const mnozstviValue = parseFloat(mnozstviInput.value) || 1;
    
    const cenaBezDphEl = document.getElementById('polozka-calc-bez-dph');
    const cenaSDphEl = document.getElementById('polozka-calc-s-dph');
    
    if (cenaSDphToggle.checked) {
        // Pokud zadává cenu s DPH, vypočítáme cenu bez DPH
        const cenaBezDph = calculatePriceWithoutVAT(cenaValue, dphValue);
        cenaBezDphEl.textContent = formatCurrency(cenaBezDph);
        cenaSDphEl.textContent = formatCurrency(cenaValue);
    } else {
        // Pokud zadává cenu bez DPH, vypočítáme cenu s DPH
        const cenaSDph = calculatePriceWithVAT(cenaValue, dphValue);
        cenaBezDphEl.textContent = formatCurrency(cenaValue);
        cenaSDphEl.textContent = formatCurrency(cenaSDph);
    }
}

// Zobrazení modálního okna pro přidání položky
function showAddPolozkaModal() {
    // Reset formuláře
    document.getElementById('polozka-form').reset();
    document.getElementById('polozka-id').value = '';
    
    // Nastavení titulku
    document.getElementById('modal-polozka-title').textContent = 'Přidat položku';
    
    // Reset štítku ceny
    document.getElementById('polozka-cena-label').textContent = 'Cena za m.j. bez DPH';
    
    // Reset vypočtených hodnot
    document.getElementById('polozka-calc-bez-dph').textContent = '0,00 Kč';
    document.getElementById('polozka-calc-s-dph').textContent = '0,00 Kč';
    
    // Zobrazení modálního okna
    document.getElementById('modal-polozka').classList.add('active');
}

// Uložení položky
function savePolozka() {
    try {
        // Získání dat z formuláře
        const id = document.getElementById('polozka-id').value;
        const nazev = document.getElementById('polozka-nazev').value;
        const mnozstviStr = document.getElementById('polozka-mnozstvi').value;
        const cenaStr = document.getElementById('polozka-cena').value;
        const dphStr = document.getElementById('polozka-dph').value;
        const cenaSDphToggle = document.getElementById('polozka-cena-s-dph-toggle').checked;
        
        // Konverze hodnot
        const mnozstvi = parseFloat(mnozstviStr);
        let cena = parseFloat(cenaStr);
        const dph = parseInt(dphStr);
        
        // Validace dat
        if (!nazev) {
            showFakturaNotification('Název položky je povinný.', 'error');
            return;
        }
        
        if (isNaN(mnozstvi) || mnozstvi <= 0) {
            showFakturaNotification('Množství musí být kladné číslo.', 'error');
            return;
        }
        
        if (isNaN(cena) || cena <= 0) {
            showFakturaNotification('Cena musí být kladné číslo.', 'error');
            return;
        }
        
        // Pokud uživatel zadal cenu s DPH, přepočítáme ji na cenu bez DPH
        if (cenaSDphToggle) {
            cena = calculatePriceWithoutVAT(cena, dph);
        }
        
        // Vytvoření položky
        const polozka = {
            id: id || 'p_' + Date.now(),
            nazev: nazev,
            mnozstvi: mnozstvi,
            cena: cena,
            dph: dph
        };
        
        // Přidání/aktualizace položky
        if (id) {
            // Aktualizace
            const index = fakturaPolozky.findIndex(p => p.id === id);
            if (index !== -1) {
                fakturaPolozky[index] = polozka;
            } else {
                fakturaPolozky.push(polozka);
            }
        } else {
            // Nová položka
            fakturaPolozky.push(polozka);
        }
        
        // Překreslení tabulky
        renderPolozkyTable();
        
        // Zavření modálního okna
        document.getElementById('modal-polozka').classList.remove('active');
        
        // Zobrazení hlášky
        showFakturaNotification('Položka byla úspěšně uložena.');
    } catch (error) {
        console.error('Chyba při ukládání položky:', error);
        showFakturaNotification('Nastala chyba při ukládání položky.', 'error');
    }
}

// Úprava položky
function editPolozka(id) {
    // Najít položku podle ID
    const polozka = fakturaPolozky.find(p => p.id === id);
    if (!polozka) {
        showFakturaNotification('Položka nebyla nalezena.', 'error');
        return;
    }
    
    // Reset přepínače
    document.getElementById('polozka-cena-s-dph-toggle').checked = false;
    document.getElementById('polozka-cena-label').textContent = 'Cena za m.j. bez DPH';
    
    // Vyplnění formuláře
    document.getElementById('polozka-id').value = polozka.id;
    document.getElementById('polozka-nazev').value = polozka.nazev;
    document.getElementById('polozka-mnozstvi').value = polozka.mnozstvi;
    document.getElementById('polozka-cena').value = polozka.cena;
    document.getElementById('polozka-dph').value = polozka.dph;
    
    // Aktualizace vypočítaných hodnot
    updateCalculatedValues();
    
    // Změna titulku
    document.getElementById('modal-polozka-title').textContent = 'Upravit položku';
    
    // Zobrazení modálního okna
    document.getElementById('modal-polozka').classList.add('active');
}

// Smazání položky
function deletePolozka(id) {
    fakturaPolozky = fakturaPolozky.filter(p => p.id !== id);
    renderPolozkyTable();
    showFakturaNotification('Položka byla odstraněna.');
}

// Vykreslení tabulky položek
function renderPolozkyTable() {
    const tableBody = document.getElementById('polozky-list');
    tableBody.innerHTML = '';
    
    const isMobile = window.innerWidth <= 768;
    const container = document.querySelector('.faktura-table-container');
    
    if (fakturaPolozky.length === 0) {
        // Když nejsou položky, přidáme informační řádek nebo kartu
        if (isMobile) {
            container.classList.add('faktura-cards-container');
            const emptyCard = document.createElement('div');
            emptyCard.className = 'faktura-card faktura-card-empty';
            emptyCard.innerHTML = `
                <div class="faktura-card-content">
                    <p>Zatím nebyly přidány žádné položky. Použijte tlačítko "Přidat položku" níže.</p>
                </div>
            `;
            tableBody.appendChild(emptyCard);
        } else {
            container.classList.remove('faktura-cards-container');
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="8" style="text-align: center; padding: 20px;">
                    Zatím nebyly přidány žádné položky. Použijte tlačítko "Přidat položku" níže.
                </td>
            `;
            tableBody.appendChild(emptyRow);
        }
        
        // Vynulujeme celkové částky
        document.getElementById('celkem-bez-dph').textContent = formatCurrency(0);
        document.getElementById('celkem-dph').textContent = formatCurrency(0);
        document.getElementById('celkem-s-dph').textContent = formatCurrency(0);
        
        return;
    }
    
    let celkemBezDph = 0;
    let celkemDph = 0;
    let celkemSDph = 0;
    
    // Přepnutí mezi tabulkou a kartičkami podle zařízení
    if (isMobile) {
        container.classList.add('faktura-cards-container');
        
        // Zobrazení položek jako kartiček na mobilních zařízeních
        fakturaPolozky.forEach((polozka) => {
            // Výpočet hodnot
            const cenaBezDph = polozka.mnozstvi * polozka.cena;
            const dphCastka = cenaBezDph * (polozka.dph / 100);
            const celkem = cenaBezDph + dphCastka;
            
            // Přičtení k celkovým hodnotám
            celkemBezDph += cenaBezDph;
            celkemDph += dphCastka;
            celkemSDph += celkem;
            
            // Vytvoření kartičky
            const card = document.createElement('div');
            card.className = 'faktura-card';
            card.innerHTML = `
                <div class="faktura-card-header">
                    <h3 class="faktura-card-title">${polozka.nazev}</h3>
                </div>
                <div class="faktura-card-content">
                    <div class="faktura-card-row">
                        <span>Množství:</span>
                        <span>${polozka.mnozstvi}</span>
                    </div>
                    <div class="faktura-card-row">
                        <span>Cena za m.j.:</span>
                        <span>${formatCurrency(polozka.cena)}</span>
                    </div>
                    <div class="faktura-card-row">
                        <span>DPH:</span>
                        <span>${polozka.dph} %</span>
                    </div>
                    <div class="faktura-card-row">
                        <span>Bez DPH:</span>
                        <span>${formatCurrency(cenaBezDph)}</span>
                    </div>
                    <div class="faktura-card-row">
                        <span>DPH:</span>
                        <span>${formatCurrency(dphCastka)}</span>
                    </div>
                    <div class="faktura-card-row faktura-card-total">
                        <span>Celkem:</span>
                        <span>${formatCurrency(celkem)}</span>
                    </div>
                </div>
                <div class="faktura-card-footer">
                    <button type="button" class="faktura-btn faktura-btn-sm faktura-btn-secondary btn-edit-polozka" data-id="${polozka.id}">Upravit</button>
                    <button type="button" class="faktura-btn faktura-btn-sm faktura-btn-secondary btn-delete-polozka" data-id="${polozka.id}">Smazat</button>
                </div>
            `;
            
            tableBody.appendChild(card);
        });
        
        // Přidání souhrnné kartičky
        const summaryCard = document.createElement('div');
        summaryCard.className = 'faktura-card faktura-card-summary';
        summaryCard.innerHTML = `
            <div class="faktura-card-header">
                <h3 class="faktura-card-title">Celkem</h3>
            </div>
            <div class="faktura-card-content">
                <div class="faktura-card-row">
                    <span>Bez DPH:</span>
                    <span id="mobile-celkem-bez-dph">${formatCurrency(celkemBezDph)}</span>
                </div>
                <div class="faktura-card-row">
                    <span>DPH:</span>
                    <span id="mobile-celkem-dph">${formatCurrency(celkemDph)}</span>
                </div>
                <div class="faktura-card-row faktura-card-total">
                    <span>Celkem s DPH:</span>
                    <span id="mobile-celkem-s-dph">${formatCurrency(celkemSDph)}</span>
                </div>
            </div>
        `;
        
        tableBody.appendChild(summaryCard);
        
    } else {
        container.classList.remove('faktura-cards-container');
        
        // Standardní zobrazení položek jako tabulky
        fakturaPolozky.forEach((polozka) => {
            // Výpočet hodnot
            const cenaBezDph = polozka.mnozstvi * polozka.cena;
            const dphCastka = cenaBezDph * (polozka.dph / 100);
            const celkem = cenaBezDph + dphCastka;
            
            // Přičtení k celkovým hodnotám
            celkemBezDph += cenaBezDph;
            celkemDph += dphCastka;
            celkemSDph += celkem;
            
            // Vytvoření řádku
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${polozka.nazev}</td>
                <td>${polozka.mnozstvi}</td>
                <td>${formatCurrency(polozka.cena)}</td>
                <td>${polozka.dph} %</td>
                <td>${formatCurrency(cenaBezDph)}</td>
                <td>${formatCurrency(dphCastka)}</td>
                <td>${formatCurrency(celkem)}</td>
                <td class="faktura-table-actions">
                    <button type="button" class="faktura-btn faktura-btn-sm faktura-btn-secondary btn-edit-polozka" data-id="${polozka.id}">Upravit</button>
                    <button type="button" class="faktura-btn faktura-btn-sm faktura-btn-secondary btn-delete-polozka" data-id="${polozka.id}">Smazat</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Aktualizace celkových částek
    document.getElementById('celkem-bez-dph').textContent = formatCurrency(celkemBezDph);
    document.getElementById('celkem-dph').textContent = formatCurrency(celkemDph);
    document.getElementById('celkem-s-dph').textContent = formatCurrency(celkemSDph);
}

// Zobrazení náhledu faktury
function showPreviewModal() {
    // Kontrola povinných údajů
    if (!validateFakturaForm()) {
        showFakturaNotification('Vyplňte všechny povinné údaje faktury.', 'error');
        return;
    }
    
    // Kontrola, zda jsou přidány položky
    if (fakturaPolozky.length === 0) {
        showFakturaNotification('Přidejte alespoň jednu položku faktury.', 'error');
        return;
    }
    
    // Vygenerování náhledu
    generateFakturaPreview();
    
    // Zobrazení modálního okna
    document.getElementById('modal-preview').classList.add('active');
}

// Validace formuláře faktury
function validateFakturaForm() {
    // Kontrola nastavení faktury
    const fakturaNumber = document.getElementById('faktura-cislo').value;
    const vystaveniDate = document.getElementById('faktura-datum-vystaveni').value;
    const plneniDate = document.getElementById('faktura-datum-plneni').value;
    const splatnostDate = document.getElementById('faktura-datum-splatnosti').value;
    const zpusobUhrady = document.getElementById('faktura-zpusob-uhrady').value;
    
    if (!fakturaNumber || !vystaveniDate || !plneniDate || !splatnostDate || !zpusobUhrady) {
        return false;
    }
    
    // Kontrola údajů odběratele - pouze jméno je povinné
    const odberatelJmeno = document.getElementById('odberatel-jmeno').value;
    
    if (!odberatelJmeno) {
        return false;
    }
    
    return true;
}

// Generování náhledu faktury
function generateFakturaPreview() {
    const previewContainer = document.getElementById('faktura-preview-container');
    
    // Zkopírování šablony
    const template = document.getElementById('faktura-template').innerHTML;
    previewContainer.innerHTML = template;
    
    // Aktualizovat zdroj obrázku loga
    if (previewContainer.querySelector('.faktura-logo')) {
        previewContainer.querySelector('.faktura-logo').src = "https://nonchalance.cz/wp-content/uploads/2025/04/logo-faktura.png";
    }
    
    // Úpravy pro konzistentní zobrazení faktury na mobilních zařízeních
    const invoiceElement = previewContainer.querySelector('.faktura-document');
    if (invoiceElement) {
        // Zajištění desktop rozložení i na mobilních zařízeních
        invoiceElement.style.width = '210mm';
        invoiceElement.style.minHeight = '297mm'; 
        invoiceElement.style.margin = '0 auto';
        invoiceElement.style.boxSizing = 'border-box';
        
        // Oprava rozložení pro zajištění konzistence
        const headerElement = invoiceElement.querySelector('.faktura-document-header');
        if (headerElement) {
            headerElement.style.display = 'flex';
            headerElement.style.flexDirection = 'row';
            headerElement.style.justifyContent = 'space-between';
        }
        
        const partiesElement = invoiceElement.querySelector('.faktura-document-parties');
        if (partiesElement) {
            partiesElement.style.display = 'flex';
            partiesElement.style.flexDirection = 'row';
            partiesElement.style.justifyContent = 'space-between';
        }
        
        const infoElement = invoiceElement.querySelector('.faktura-document-info');
        if (infoElement) {
            infoElement.style.display = 'flex';
            infoElement.style.flexDirection = 'row';
        }
    }
    
    // Doplnění údajů
    fillFakturaTemplate(previewContainer);
}

// Doplnění údajů do šablony
function fillFakturaTemplate(container) {
    // Nastavení čísla faktury
    container.querySelector('#template-faktura-cislo').textContent = document.getElementById('faktura-cislo').value;
    
    // Nastavení údajů odběratele
    const odberatelJmeno = document.getElementById('odberatel-jmeno').value;
    const odberatelAdresa = document.getElementById('odberatel-adresa').value;
    const odberatelIC = document.getElementById('odberatel-ic').value;
    const odberatelDIC = document.getElementById('odberatel-dic').value;
    
    let odberatelHtml = `<p><strong>${odberatelJmeno}</strong></p>`;
    
    if (odberatelAdresa) {
        odberatelAdresa.split('\n').forEach(line => {
            if (line.trim()) {
                odberatelHtml += `<p>${line}</p>`;
            }
        });
    }
    
    if (odberatelIC) {
        odberatelHtml += `<p>IČ: ${odberatelIC}</p>`;
    }
    
    if (odberatelDIC) {
        odberatelHtml += `<p>DIČ: ${odberatelDIC}</p>`;
    }
    
    container.querySelector('#template-odberatel-info').innerHTML = odberatelHtml;
    
    // Nastavení dat
    const vystaveniDate = formatDateForDisplay(document.getElementById('faktura-datum-vystaveni').value);
    const plneniDate = formatDateForDisplay(document.getElementById('faktura-datum-plneni').value);
    const splatnostDate = formatDateForDisplay(document.getElementById('faktura-datum-splatnosti').value);
    
    container.querySelector('#template-datum-vystaveni').textContent = vystaveniDate;
    container.querySelector('#template-datum-plneni').textContent = plneniDate;
    container.querySelector('#template-datum-splatnosti').textContent = splatnostDate;
    
    // Nastavení způsobu úhrady
    const zpusobUhrady = document.getElementById('faktura-zpusob-uhrady').value;
    container.querySelector('#template-zpusob-uhrady').textContent = zpusobUhrady;
    
    // Nastavení variabilního symbolu
    container.querySelector('#template-vs').textContent = document.getElementById('faktura-cislo').value;
    
    // Výpočet částek
    let celkemBezDph = 0;
    let celkemDph = 0;
    let celkemSDph = 0;
    
    // Mapa pro souhrn DPH podle sazeb
    const dphSouhrn = {};
    
    // Generování položek
    const polozkyBody = container.querySelector('#template-polozky');
    polozkyBody.innerHTML = '';
    
    fakturaPolozky.forEach(polozka => {
        const cenaBezDph = polozka.mnozstvi * polozka.cena;
        const dphCastka = cenaBezDph * (polozka.dph / 100);
        const celkem = cenaBezDph + dphCastka;
        
        // Přidání do celkových částek
        celkemBezDph += cenaBezDph;
        celkemDph += dphCastka;
        celkemSDph += celkem;
        
        // Přidání do souhrnu DPH
        if (!dphSouhrn[polozka.dph]) {
            dphSouhrn[polozka.dph] = {
                zaklad: 0,
                dph: 0,
                celkem: 0
            };
        }
        
        dphSouhrn[polozka.dph].zaklad += cenaBezDph;
        dphSouhrn[polozka.dph].dph += dphCastka;
        dphSouhrn[polozka.dph].celkem += celkem;
        
        // Vytvoření řádku
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${polozka.nazev}</td>
            <td>${polozka.mnozstvi}</td>
            <td>${formatCurrency(polozka.cena)}</td>
            <td>${polozka.dph} %</td>
            <td>${formatCurrency(cenaBezDph)}</td>
            <td>${formatCurrency(dphCastka)}</td>
            <td>${formatCurrency(celkem)}</td>
        `;
        
        polozkyBody.appendChild(row);
    });
    
    // Nastavení celkové částky v hlavičce
    container.querySelector('#template-celkem').textContent = formatCurrency(celkemSDph);
    
    // Generování souhrnu DPH
    const dphSouhrnBody = container.querySelector('#template-dph-souhrn');
    dphSouhrnBody.innerHTML = '';
    
    // Seřazení sazeb
    const dphRates = Object.keys(dphSouhrn).sort((a, b) => parseInt(a) - parseInt(b));
    
    dphRates.forEach(rate => {
        const row = document.createElement('tr');
        const data = dphSouhrn[rate];
        
        row.innerHTML = `
            <td>${rate} %</td>
            <td>${formatCurrency(data.zaklad)}</td>
            <td>${formatCurrency(data.dph)}</td>
            <td>${formatCurrency(data.celkem)}</td>
        `;
        
        dphSouhrnBody.appendChild(row);
    });
    
    // Nastavení celkových částek v souhrnu
    container.querySelector('#template-souhrn-zaklad').textContent = formatCurrency(celkemBezDph);
    container.querySelector('#template-souhrn-dph').textContent = formatCurrency(celkemDph);
    container.querySelector('#template-souhrn-celkem').textContent = formatCurrency(celkemSDph);
    
    // Nastavení celkové částky v patičce
    container.querySelector('#template-summary-total').textContent = formatCurrency(celkemSDph);
}

// Funkce pro stažení faktury jako PDF
function downloadInvoiceAsPDF() {
    // Kontrola povinných údajů
    if (!validateFakturaForm()) {
        showFakturaNotification('Vyplňte všechny povinné údaje faktury.', 'error');
        return;
    }
    
    // Kontrola, zda jsou přidány položky
    if (fakturaPolozky.length === 0) {
        showFakturaNotification('Přidejte alespoň jednu položku faktury.', 'error');
        return;
    }
    
    // Zkontrolujeme, zda existují potřebné knihovny
    if (typeof html2canvas === 'undefined') {
        showFakturaNotification('Pro vytvoření PDF je potřeba knihovna html2canvas.', 'error');
        return;
    }
    
    if (typeof jspdf === 'undefined') {
        showFakturaNotification('Pro vytvoření PDF je potřeba knihovna jsPDF.', 'error');
        return;
    }
    
    // Zobrazení loaderu
    showFakturaLoader();
    
    try {
        // Vytvoříme dočasný div mimo viditelnou oblast
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '210mm'; // Přesná šířka A4
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.zIndex = '-1000';
        document.body.appendChild(tempDiv);
        
        // Zkopírujeme šablonu
        tempDiv.innerHTML = document.getElementById('faktura-template').innerHTML;
        
        // Upravíme styly faktury pro PDF - stejné pro mobil i desktop
        const invoiceElement = tempDiv.querySelector('.faktura-document');
        if (invoiceElement) {
            // Nastavení přesné velikosti A4 a zrušení výšky, aby se faktura přizpůsobila obsahu
            invoiceElement.style.width = '210mm';
            invoiceElement.style.height = 'auto';
            invoiceElement.style.margin = '0';
            invoiceElement.style.padding = '20mm 15mm'; 
            
            // Odstranění všech media queries a responsivních stylů
            invoiceElement.classList.remove('faktura-mobile');
            
            // Zachování desktop rozložení bez ohledu na zařízení
            const headerElement = invoiceElement.querySelector('.faktura-document-header');
            if (headerElement) {
                headerElement.style.display = 'flex';
                headerElement.style.flexDirection = 'row';
                headerElement.style.alignItems = 'flex-start';
                headerElement.style.justifyContent = 'space-between';
            }
            
            const partiesElement = invoiceElement.querySelector('.faktura-document-parties');
            if (partiesElement) {
                partiesElement.style.display = 'flex';
                partiesElement.style.flexDirection = 'row';
                partiesElement.style.justifyContent = 'space-between';
            }
            
            const supplierElement = invoiceElement.querySelector('.faktura-document-supplier');
            const customerElement = invoiceElement.querySelector('.faktura-document-customer');
            if (supplierElement && customerElement) {
                supplierElement.style.width = '45%';
                customerElement.style.width = '45%';
            }
            
            const infoElement = invoiceElement.querySelector('.faktura-document-info');
            if (infoElement) {
                infoElement.style.display = 'flex';
                infoElement.style.flexDirection = 'row';
                infoElement.style.justifyContent = 'space-between';
            }
            
            const datesElement = invoiceElement.querySelector('.faktura-document-dates');
            const paymentElement = invoiceElement.querySelector('.faktura-document-payment');
            if (datesElement && paymentElement) {
                datesElement.style.width = '33%';
                paymentElement.style.width = '65%';
                datesElement.style.borderRight = '1px solid #ddd';
            }
            
            // Zrušení absolute position pro footer, aby se korektně zobrazil
            const footer = invoiceElement.querySelector('.faktura-document-footer');
            if (footer) {
                footer.style.position = 'relative';
                footer.style.bottom = 'auto';
                footer.style.left = 'auto';
                footer.style.right = 'auto';
                footer.style.marginTop = '30mm';
            }
        }
        
        // Aktualizovat zdroj obrázku loga na novou adresu
        if (tempDiv.querySelector('.faktura-logo')) {
            const logoImg = tempDiv.querySelector('.faktura-logo');
            logoImg.src = "https://nonchalance.cz/wp-content/uploads/2025/04/logo-faktura.png";
            logoImg.style.width = '180px';
            logoImg.style.height = 'auto';
        }
        
        // Doplníme údaje do šablony
        fillFakturaTemplate(tempDiv);
        
        // Získáme element s fakturou
        if (!invoiceElement) {
            throw new Error("Element s fakturou nebyl nalezen");
        }
        
        // Počkáme na načtení obrázku
        const logoImg = tempDiv.querySelector('.faktura-logo');
        
        // Funkce pro kontrolu, zda je obrázek načten
        const waitForImageLoad = () => {
            return new Promise((resolve) => {
                if (logoImg.complete) {
                    resolve();
                } else {
                    logoImg.onload = resolve;
                    logoImg.onerror = resolve; // Pokračujeme i v případě chyby
                }
            });
        };
        
        // Počkáme na načtení obrázku a pak vytvoříme PDF
        waitForImageLoad().then(() => {
            // Přidáme trochu prodlevy pro jistotu
            setTimeout(() => {
                // Nastavení pro canvas - jednotné bez ohledu na zařízení
                const options = {
                    scale: 2, // Vyšší rozlišení
                    useCORS: true, // Povolení cross-origin obrázků
                    allowTaint: true, // Povolení "tainted" canvas
                    backgroundColor: '#ffffff', // Bílé pozadí
                    logging: false, // Vypneme logování
                    imageTimeout: 0, // Bez timeoutu pro obrázky
                    windowWidth: 1000, // Pevná šířka pro konzistentní výsledek
                    windowHeight: 1500, // Pevná výška pro konzistentní výsledek
                    ignoreElements: (element) => {
                        // Ignorovat mobilní specifické styly
                        return element.classList.contains('faktura-mobile');
                    }
                };
                
                // Vytvoření obrázku z faktury
                html2canvas(invoiceElement, options).then(canvas => {
                    try {
                        // Dimenze PDF ve formátu A4
                        const imgWidth = 210; // A4 šířka v mm
                        const imgHeight = 297; // A4 výška v mm
                        
                        // Vytvoření PDF dokumentu s kompresí
                        const pdf = new jspdf.jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: 'a4',
                            compress: true,
                            hotfixes: ["px_scaling"], // Oprava pro správné škálování
                        });
                        
                        // Přidáme metadata do PDF
                        const fakturaNumber = document.getElementById('faktura-cislo').value;
                        pdf.setProperties({
                            title: `Faktura ${fakturaNumber}`,
                            subject: `Faktura pro ${document.getElementById('odberatel-jmeno').value}`,
                            author: 'Edita Prokešová, DiS.',
                            keywords: 'faktura, daňový doklad',
                            creator: 'NONCHALANCE GARDEN - Fakturační systém'
                        });
                        
                        // Výpočet poměru pro správné umístění
                        const imgRatio = canvas.height / canvas.width;
                        const pdfRatio = imgHeight / imgWidth;
                        
                        let finalHeight, finalWidth;
                        if (imgRatio > pdfRatio) {
                            // Obrázek je vyšší než PDF
                            finalHeight = imgHeight;
                            finalWidth = (canvas.width * finalHeight) / canvas.height;
                        } else {
                            // Obrázek je širší než PDF
                            finalWidth = imgWidth;
                            finalHeight = (canvas.height * finalWidth) / canvas.width;
                        }
                        
                        // Přidáme obrázek s vypočtenými rozměry
                        pdf.addImage(
                            canvas.toDataURL('image/jpeg', 0.95), // Komprese pro menší velikost
                            'JPEG',
                            0,
                            0,
                            finalWidth,
                            finalHeight
                        );
                        
                        // Pokud je dokument vyšší než jedna stránka, přidáme více stránek
                        if (finalHeight > imgHeight) {
                            let curHeight = imgHeight;
                            while (curHeight < finalHeight) {
                                pdf.addPage();
                                pdf.addImage(
                                    canvas.toDataURL('image/jpeg', 0.95),
                                    'JPEG',
                                    0,
                                    -curHeight,
                                    finalWidth,
                                    finalHeight
                                );
                                curHeight += imgHeight;
                            }
                        }
                        
                       // Uložíme PDF s konkrétním názvem
                        pdf.save(`Faktura_${fakturaNumber}.pdf`);
                        
                        // Zobrazení hlášky o úspěchu
                        showFakturaNotification('Faktura byla úspěšně stažena jako PDF.');
                    } catch (conversionError) {
                        console.error('Chyba při vytváření PDF:', conversionError);
                        showFakturaNotification('Nastala chyba při konverzi faktury do PDF.', 'error');
                    } finally {
                        // Odstranění dočasného divu
                        document.body.removeChild(tempDiv);
                        hideFakturaLoader();
                    }
                }).catch(canvasError => {
                    console.error('Chyba při vytváření canvas:', canvasError);
                    showFakturaNotification('Nastala chyba při generování obrázku pro PDF.', 'error');
                    document.body.removeChild(tempDiv);
                    hideFakturaLoader();
                });
            }, 300);
        }).catch(imgError => {
            console.error('Chyba při načítání obrázku:', imgError);
            showFakturaNotification('Nastala chyba při načítání loga.', 'error');
            document.body.removeChild(tempDiv);
            hideFakturaLoader();
        });
        
    } catch (error) {
        console.error('Chyba při zpracování faktury:', error);
        showFakturaNotification('Nastala chyba při zpracování faktury.', 'error');
        hideFakturaLoader();
    }
}
