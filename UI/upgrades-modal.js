function fillUpgradeModal($modal, stackName) {
const data           = window.getUpgradeData(stackName);
const activeGlobals  = data.upgrades        || Object.keys(upgrades);
const activeGenerals = data.generalUpgrades || Object.keys(generalUpgrades);

    function buildList(sourceObj, activeKeys) {
        return Object.keys(sourceObj).map(key => {
            const item   = sourceObj[key];
            const img    = item.image || 'https://dummyimage.com/40x27/8c8c8c/ffffff&text=error';
            const desc   = item.description || 'No description available.';
            const checked = activeKeys.includes(key) ? 'checked' : '';
            return `
              <div class="upgrade-item">
                <div class="upgrade-row">
                  <img src="${img}">
                  <span>${key}</span>
                  <input type="checkbox" value="${key}" ${checked}>
                  <span class="upgrade-desc-toggle" title="Details">ℹ️</span>
                </div>
                <div class="upgrade-desc">${desc}</div>
              </div>`;
        }).join('');
    }

    $modal.find('.global-upgrades').html(buildList(upgrades, activeGlobals));
    $modal.find('.general-upgrades').html(buildList(generalUpgrades, activeGenerals));

    // “Select All” toggles
    $modal.on('change', '.select-all-global', function () {
        $modal.find('.global-upgrades input[type=checkbox]').prop('checked', this.checked);
    });
    $modal.on('change', '.select-all-general', function () {
        $modal.find('.general-upgrades input[type=checkbox]').prop('checked', this.checked);
    });

    // Individual info toggles
    $modal.off('click', '.upgrade-desc-toggle')
          .on('click', '.upgrade-desc-toggle', function () {
              $(this).closest('.upgrade-item').find('.upgrade-desc').slideToggle(150);
          });
}

$(document)
    // open the modal
    .on('click', '.gear-icon', function () {
        const $stack   = $(this).closest('.stack');
        const $modal   = $stack.find('.upgrade-modal');
        const stackName = $stack.find('.stack-title').text();
        fillUpgradeModal($modal, stackName);
        $modal.fadeIn(150);
    })

    // close modal
    .on('click', '.upgrade-modal .modal-close', function () {
        $(this).closest('.upgrade-modal').fadeOut(150);
    })

    // apply & save
    .on('click', '.upgrade-modal .btn-apply', function () {
        const $modal    = $(this).closest('.upgrade-modal');
        const $stack    = $modal.closest('.stack');
        const stackName = $stack.find('.stack-title').text();

        const chosenGlobals  = $modal.find('.global-upgrades   input[type=checkbox]:checked').map((_, el) => el.value).get();
        const chosenGenerals = $modal.find('.general-upgrades  input[type=checkbox]:checked').map((_, el) => el.value).get();
        window.setUpgradeData(stackName, chosenGlobals, chosenGenerals);

        $modal.fadeOut(150);
    });