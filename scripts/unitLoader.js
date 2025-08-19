function initPicker() {
  if (!window.UNIT_CATALOG) {
    setTimeout(initPicker, 30);
    return;
  }

  const picker = document.getElementById('unit-set-picker');

  /* ---- populate ---- */
  picker.innerHTML = '';
  window.UNIT_CATALOG.forEach(name => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = name;
    picker.appendChild(opt);
  });
  picker.value = localStorage.getItem('aw_unitsFile') || '000 - Default Units.js';
  picker.querySelectorAll('option').forEach(opt =>
  opt.textContent = opt.value.replace(/\.js$/, '')
);

  /* ---- skin with Select2 ---- */
  $(picker).select2({
    placeholder: 'Search sets…',
    allowClear: false,
    minimumResultsForSearch: 0,
    dropdownCssClass: 'select2-unit-sets',
    width: '300px'
  });

  /* ---- single handler attached via jQuery ---- */
  $(picker).off('change');               // make sure we never double-bind
  $(picker).on('change', function () {
    const newFile = this.value;
    localStorage.setItem('aw_unitsFile', newFile);

    const old   = document.getElementById('units-script');
    const fresh = document.createElement('script');
    fresh.id    = 'units-script';
    fresh.src   = 'units/' + encodeURIComponent(newFile);
    fresh.onload = () => location.reload();
    old.replaceWith(fresh);
  });
}

initPicker();