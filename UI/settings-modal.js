$(document)
  // open settings panel from settings button
  .on('click', '#settings-button', function () {
    const $modal = $('#settings-modal');          // global modal
    $modal.find('.sort-check').prop('checked', localStorage.getItem('aw_sort') !== 'false');
    $modal.find('.default-count').val(+localStorage.getItem('aw_defaultCount') || 5);
    $modal.find('.units-key').val(localStorage.getItem('aw_unitsKey') || '*');
    $modal.fadeIn(150);
  })
  // close settings
  .on('click', '#settings-modal .modal-close', function () {
    $('#settings-modal').fadeOut(150);
  })
  // apply settings
  .on('click', '#settings-modal .btn-apply', function () {
  const $modal = $('#settings-modal');
  localStorage.setItem('aw_sort',        $modal.find('.sort-check').is(':checked'));
  localStorage.setItem('aw_defaultCount',$modal.find('.default-count').val());
  localStorage.setItem('aw_unitsKey',    $modal.find('.units-key').val());
  window.refreshUnitList();
  $modal.fadeOut(150);
});

  // hook the standalone settings button
$('#settings-button').on('click', () => $('#settings-modal').fadeIn(150));