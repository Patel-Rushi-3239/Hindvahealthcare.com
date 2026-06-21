/* =====================================================================
   HINDVA HEALTHCARE — Edit Mode System
   Hidden admin panel with inline editing, product management & persistence
   ===================================================================== */
(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────────────
     CONFIGURATION
     ─────────────────────────────────────────────────────────────── */
  var CONFIG = {
    username: 'hindvaadmin',
    password: 'Hindva@2026',
    triggerClicks: 5,
    triggerTimeout: 3000,
    storageKey: 'hindva_edit_data',
    sessionKey: 'hindva_edit_session'
  };

  /* ───────────────────────────────────────────────────────────────
     STATE
     ─────────────────────────────────────────────────────────────── */
  var state = {
    isActive: false,
    clickCount: 0,
    clickTimer: null,
    currentImgTarget: null,
    editingProductKey: null
  };

  /* ───────────────────────────────────────────────────────────────
     PRODUCT DATA (mirrors main.js productData)
     ─────────────────────────────────────────────────────────────── */
  var defaultProductData = {
    'rabihin-dsr': {
      name: 'Rabihin-DSR',
      image: 'images/products/Rabihin-dsr-img-new.jpg?v=2',
      category: 'Gastroenterology',
      tagline: 'Advanced Stomach Acid Control',
      composition: 'Enteric Coated Rabeprazole Sodium & Domperidone SR Capsules',
      description: 'Rabihin-DSR is a high-quality capsule that helps control stomach acid and nausea. It gives you fast and long-lasting relief from heartburn, acid reflux, and stomach ulcers.',
      benefits: [
        'Fast and long-lasting control of stomach acid',
        'Quick relief from heartburn and acid reflux',
        'Helps with digestion and prevents nausea',
        'Special coating ensures the medicine works where it needs to',
        'Safe to use with very few side effects'
      ],
      icon: '💊'
    },
    'hincure-ointment': {
      name: 'Hincure Ayurvedic Ointment',
      image: 'images/products/ointment-img-new.jpg?v=2',
      category: 'Ayurvedic / Topical',
      tagline: 'Natural Healing, Fast Results',
      composition: 'Traditional Ayurvedic Herbal Formula',
      description: 'Hincure Ayurvedic Ointment is a 100% natural cream made from a perfect mix of ancient herbs. It is designed to heal skin fast, calm redness, and help your body repair cuts, burns, and rashes naturally.',
      benefits: [
        'Heals skin fast using natural herbs',
        'Calms down skin redness and swelling',
        '100% natural — absolutely no harsh chemicals',
        'Works great on cuts, burns, rashes, and dry skin',
        'Safe to use every day on all skin types'
      ],
      icon: '🌿'
    },
    'joint-h': {
      name: 'Joint-H Nutraceuticals',
      image: 'images/products/joint-H-img-new.jpg?v=2',
      category: 'Nutraceutical / Orthopedic',
      tagline: 'Move Freely, Live Pain-Free',
      composition: 'Glucosamine, Boswellia Serrata & Domperidone Capsules',
      description: 'Joint-H is an advanced health supplement made to keep your joints healthy, lower pain, and help you move easily. It combines powerful natural ingredients to protect your joints and let you enjoy an active life without pain.',
      benefits: [
        'Gives real relief from joint pain and stiffness',
        'Helps repair and protect your joints',
        'Naturally lowers swelling and pain',
        'Helps you move and bend easily',
        'Perfect everyday supplement for strong joints'
      ],
      icon: '🦴'
    }
  };

  /* ───────────────────────────────────────────────────────────────
     UTILITY FUNCTIONS
     ─────────────────────────────────────────────────────────────── */
  function generateKey(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function showToast(message, type) {
    type = type || 'info';
    var existing = document.querySelector('.em-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'em-toast ' + type;
    toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') + '"></i> ' + message;
    document.body.appendChild(toast);

    setTimeout(function () { toast.classList.add('show'); }, 50);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 400);
    }, 2800);
  }

  /* ───────────────────────────────────────────────────────────────
     1. HIDDEN TRIGGER — 5x click on copyright text
     ─────────────────────────────────────────────────────────────── */
  function initHiddenTrigger() {
    var footerBottom = document.querySelector('.footer-bottom');
    if (!footerBottom) return;

    var triggerTarget = footerBottom.querySelector('span');
    if (!triggerTarget) triggerTarget = footerBottom;

    triggerTarget.addEventListener('click', function (e) {
      e.preventDefault();
      state.clickCount++;

      if (state.clickTimer) clearTimeout(state.clickTimer);
      state.clickTimer = setTimeout(function () {
        state.clickCount = 0;
      }, CONFIG.triggerTimeout);

      if (state.clickCount >= CONFIG.triggerClicks) {
        state.clickCount = 0;
        clearTimeout(state.clickTimer);
        if (state.isActive) {
          showToast('Already in Edit Mode', 'info');
        } else {
          openLoginModal();
        }
      }
    });
  }

  /* ───────────────────────────────────────────────────────────────
     2. LOGIN MODAL
     ─────────────────────────────────────────────────────────────── */
  var loginOverlay = null;

  function createLoginModal() {
    if (loginOverlay) return loginOverlay;

    loginOverlay = document.createElement('div');
    loginOverlay.className = 'em-login-overlay';
    loginOverlay.innerHTML =
      '<div class="em-login-box">' +
        '<button class="em-login-close">&times;</button>' +
        '<div class="em-login-icon"><i class="fas fa-lock"></i></div>' +
        '<h3>Admin Login</h3>' +
        '<p class="em-login-subtitle">Enter credentials to access edit mode</p>' +
        '<div class="em-login-error" id="em-login-error">Invalid username or password</div>' +
        '<div class="em-login-field">' +
          '<label>Username</label>' +
          '<input type="text" id="em-username" placeholder="Enter username" autocomplete="off">' +
        '</div>' +
        '<div class="em-login-field">' +
          '<label>Password</label>' +
          '<input type="password" id="em-password" placeholder="Enter password">' +
        '</div>' +
        '<button class="em-login-btn" id="em-login-submit">Login <i class="fas fa-arrow-right"></i></button>' +
      '</div>';

    document.body.appendChild(loginOverlay);

    // Events
    loginOverlay.querySelector('.em-login-close').addEventListener('click', closeLoginModal);
    loginOverlay.addEventListener('click', function (e) {
      if (e.target === loginOverlay) closeLoginModal();
    });

    var submitBtn = loginOverlay.querySelector('#em-login-submit');
    submitBtn.addEventListener('click', handleLogin);

    loginOverlay.querySelector('#em-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleLogin();
    });

    return loginOverlay;
  }

  function openLoginModal() {
    var modal = createLoginModal();
    modal.classList.add('active');
    var errEl = modal.querySelector('#em-login-error');
    if (errEl) errEl.classList.remove('show');
    var uInput = modal.querySelector('#em-username');
    var pInput = modal.querySelector('#em-password');
    if (uInput) uInput.value = '';
    if (pInput) pInput.value = '';
    setTimeout(function () { if (uInput) uInput.focus(); }, 350);
  }

  function closeLoginModal() {
    if (loginOverlay) loginOverlay.classList.remove('active');
  }

  function handleLogin() {
    var uInput = document.getElementById('em-username');
    var pInput = document.getElementById('em-password');
    var errEl = document.getElementById('em-login-error');

    var u = uInput ? uInput.value.trim() : '';
    var p = pInput ? pInput.value : '';

    if (u === CONFIG.username && p === CONFIG.password) {
      closeLoginModal();
      sessionStorage.setItem(CONFIG.sessionKey, 'true');
      activateEditMode();
      showToast('Edit Mode Activated!', 'success');
    } else {
      if (errEl) errEl.classList.add('show');
      if (pInput) { pInput.value = ''; pInput.focus(); }
    }
  }

  /* ───────────────────────────────────────────────────────────────
     3. ADMIN TOOLBAR
     ─────────────────────────────────────────────────────────────── */
  var toolbar = null;

  function createToolbar() {
    if (toolbar) return toolbar;

    toolbar = document.createElement('div');
    toolbar.className = 'em-toolbar';
    toolbar.innerHTML =
      '<div class="em-toolbar-left">' +
        '<div class="em-toolbar-indicator">' +
          '<span class="em-dot"></span>' +
          '<span>EDIT MODE</span>' +
        '</div>' +
        '<span class="em-change-badge" id="em-change-badge" title="Unsaved changes">0 changes</span>' +
      '</div>' +
      '<div class="em-toolbar-right">' +
        '<button class="em-toolbar-btn em-btn-add" id="em-add-product"><i class="fas fa-plus"></i> <span class="em-btn-text">Add Product</span></button>' +
        '<button class="em-toolbar-btn em-btn-export" id="em-export"><i class="fas fa-download"></i> <span class="em-btn-text">Export</span></button>' +
        '<button class="em-toolbar-btn em-btn-save" id="em-save-all"><i class="fas fa-save"></i> <span class="em-btn-text">Save All</span></button>' +
        '<button class="em-toolbar-btn em-btn-reset" id="em-reset-all"><i class="fas fa-undo"></i> <span class="em-btn-text">Reset</span></button>' +
        '<button class="em-toolbar-btn em-btn-logout" id="em-logout"><i class="fas fa-sign-out-alt"></i> <span class="em-btn-text">Logout</span></button>' +
      '</div>';

    document.body.prepend(toolbar);

    // Events
    document.getElementById('em-save-all').addEventListener('click', saveAllChanges);
    document.getElementById('em-reset-all').addEventListener('click', resetAllChanges);
    document.getElementById('em-logout').addEventListener('click', deactivateEditMode);
    document.getElementById('em-add-product').addEventListener('click', function () {
      openProductModal(null);
    });
    document.getElementById('em-export').addEventListener('click', exportChanges);

    return toolbar;
  }

  /* ───────────────────────────────────────────────────────────────
     CHANGE COUNTER
     ─────────────────────────────────────────────────────────────── */
  var changeCount = 0;

  function trackChanges() {
    // Listen for input on all editable elements
    document.addEventListener('input', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-editable')) {
        changeCount++;
        updateChangeBadge();
      }
    });
  }

  function updateChangeBadge() {
    var badge = document.getElementById('em-change-badge');
    if (badge) {
      badge.textContent = changeCount + ' change' + (changeCount !== 1 ? 's' : '');
      badge.style.display = changeCount > 0 ? 'inline-flex' : 'none';
    }
  }

  /* ───────────────────────────────────────────────────────────────
     EXPORT CHANGES AS JSON
     ─────────────────────────────────────────────────────────────── */
  function exportChanges() {
    var data = loadFromStorage();
    if (!data || (Object.keys(data).length === 0)) {
      showToast('No saved changes to export. Save first!', 'error');
      return;
    }

    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'hindva-edits-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Changes exported as JSON!', 'success');
  }

  /* ───────────────────────────────────────────────────────────────
     4. ACTIVATE / DEACTIVATE EDIT MODE
     ─────────────────────────────────────────────────────────────── */
  function activateEditMode() {
    state.isActive = true;

    createToolbar();
    toolbar.classList.add('active');
    document.body.classList.add('em-active');

    // Make all data-editable elements contenteditable
    var editables = document.querySelectorAll('[data-editable]');
    editables.forEach(function (el) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
    });

    // Add image edit overlays
    setupImageEditing();

    // Add product management buttons
    setupProductButtons();

    // Track changes
    changeCount = 0;
    updateChangeBadge();
    trackChanges();
  }

  function deactivateEditMode() {
    state.isActive = false;

    if (toolbar) toolbar.classList.remove('active');
    document.body.classList.remove('em-active');

    // Remove contenteditable
    var editables = document.querySelectorAll('[data-editable]');
    editables.forEach(function (el) {
      el.removeAttribute('contenteditable');
    });

    // Remove image overlays
    var overlays = document.querySelectorAll('.em-img-overlay');
    overlays.forEach(function (o) { o.remove(); });

    // Remove product buttons
    var delBtns = document.querySelectorAll('.em-delete-product, .em-edit-product');
    delBtns.forEach(function (b) { b.remove(); });

    sessionStorage.removeItem(CONFIG.sessionKey);
    showToast('Logged out of Edit Mode', 'info');
  }

  /* ───────────────────────────────────────────────────────────────
     5. IMAGE EDITING
     ─────────────────────────────────────────────────────────────── */
  function setupImageEditing() {
    var editableImgs = document.querySelectorAll('[data-editable-img]');
    editableImgs.forEach(function (container) {
      if (container.querySelector('.em-img-overlay')) return;

      var overlay = document.createElement('div');
      overlay.className = 'em-img-overlay';
      overlay.innerHTML = '<span><i class="fas fa-camera"></i> Change Image</span>';
      container.style.position = 'relative';
      container.appendChild(overlay);

      overlay.querySelector('span').addEventListener('click', function (e) {
        e.stopPropagation();
        var img = container.querySelector('img');
        if (img) {
          state.currentImgTarget = img;
          openImageUrlModal(img.src);
        }
      });
    });
  }

  /* Image URL Modal */
  var imgUrlOverlay = null;

  function createImageUrlModal() {
    if (imgUrlOverlay) return imgUrlOverlay;

    imgUrlOverlay = document.createElement('div');
    imgUrlOverlay.className = 'em-imgurl-overlay';
    imgUrlOverlay.innerHTML =
      '<div class="em-imgurl-box">' +
        '<h4><i class="fas fa-image"></i> Change Image</h4>' +
        '<input type="text" id="em-img-url" placeholder="Enter image URL or path (e.g. images/products/new.png)">' +
        '<div class="em-imgurl-actions">' +
          '<button class="em-imgurl-cancel">Cancel</button>' +
          '<button class="em-imgurl-save">Apply</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(imgUrlOverlay);

    imgUrlOverlay.querySelector('.em-imgurl-cancel').addEventListener('click', closeImageUrlModal);
    imgUrlOverlay.querySelector('.em-imgurl-save').addEventListener('click', applyImageUrl);
    imgUrlOverlay.addEventListener('click', function (e) {
      if (e.target === imgUrlOverlay) closeImageUrlModal();
    });
    imgUrlOverlay.querySelector('#em-img-url').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applyImageUrl();
    });

    return imgUrlOverlay;
  }

  function openImageUrlModal(currentSrc) {
    var modal = createImageUrlModal();
    var input = modal.querySelector('#em-img-url');
    input.value = currentSrc || '';
    modal.classList.add('active');
    setTimeout(function () { input.focus(); input.select(); }, 300);
  }

  function closeImageUrlModal() {
    if (imgUrlOverlay) imgUrlOverlay.classList.remove('active');
    state.currentImgTarget = null;
  }

  function applyImageUrl() {
    var input = document.getElementById('em-img-url');
    var url = input ? input.value.trim() : '';
    if (!url) {
      showToast('Please enter an image URL', 'error');
      return;
    }
    if (state.currentImgTarget) {
      state.currentImgTarget.src = url;
      showToast('Image updated!', 'success');
    }
    closeImageUrlModal();
  }

  /* ───────────────────────────────────────────────────────────────
     6. PRODUCT MANAGEMENT
     ─────────────────────────────────────────────────────────────── */
  function setupProductButtons() {
    var productCards = document.querySelectorAll('.product-card');
    productCards.forEach(function (card) {
      if (card.querySelector('.em-delete-product')) return;

      var productKey = card.getAttribute('data-product');

      // Delete button
      var delBtn = document.createElement('button');
      delBtn.className = 'em-delete-product';
      delBtn.innerHTML = '<i class="fas fa-trash"></i>';
      delBtn.title = 'Delete Product';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this product?')) {
          deleteProduct(productKey, card);
        }
      });
      card.appendChild(delBtn);

      // Edit button
      var editBtn = document.createElement('button');
      editBtn.className = 'em-edit-product';
      editBtn.innerHTML = '<i class="fas fa-pen"></i>';
      editBtn.title = 'Edit Product Details';
      editBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openProductModal(productKey);
      });
      card.appendChild(editBtn);
    });
  }

  function deleteProduct(key, cardEl) {
    // Remove from DOM
    if (cardEl) cardEl.remove();

    // Remove from saved product data
    var savedData = loadFromStorage();
    if (savedData.products && savedData.products[key]) {
      delete savedData.products[key];
      saveToStorage(savedData);
    }

    showToast('Product deleted!', 'success');
  }

  /* Product Add/Edit Modal */
  var productOverlay = null;

  function createProductModal() {
    if (productOverlay) return productOverlay;

    productOverlay = document.createElement('div');
    productOverlay.className = 'em-product-overlay';
    productOverlay.innerHTML =
      '<div class="em-product-modal">' +
        '<h3><i class="fas fa-capsules"></i> <span id="em-product-modal-title">Add New Product</span></h3>' +
        '<div class="em-product-field">' +
          '<label>Product Name</label>' +
          '<input type="text" id="em-prod-name" placeholder="e.g. Rabihin-DSR">' +
        '</div>' +
        '<div class="em-product-field">' +
          '<label>Category</label>' +
          '<input type="text" id="em-prod-category" placeholder="e.g. Gastroenterology">' +
        '</div>' +
        '<div class="em-product-field">' +
          '<label>Tagline</label>' +
          '<input type="text" id="em-prod-tagline" placeholder="e.g. Advanced Gastric Acid Control">' +
        '</div>' +
        '<div class="em-product-field">' +
          '<label>Composition</label>' +
          '<input type="text" id="em-prod-composition" placeholder="e.g. Rabeprazole Sodium & Domperidone SR">' +
        '</div>' +
        '<div class="em-product-field">' +
          '<label>Description</label>' +
          '<textarea id="em-prod-description" placeholder="Product description..."></textarea>' +
        '</div>' +
        '<div class="em-product-field">' +
          '<label>Image URL / Path</label>' +
          '<input type="text" id="em-prod-image" placeholder="e.g. images/products/product.png">' +
        '</div>' +
        '<div class="em-product-field">' +
          '<label>Icon Emoji</label>' +
          '<input type="text" id="em-prod-icon" placeholder="e.g. 💊" maxlength="4">' +
        '</div>' +
        '<div class="em-product-field">' +
          '<label>Key Benefits</label>' +
          '<div class="em-benefits-list" id="em-benefits-list"></div>' +
          '<button class="em-benefit-add-btn" id="em-add-benefit"><i class="fas fa-plus"></i> Add Benefit</button>' +
        '</div>' +
        '<div class="em-product-actions">' +
          '<button class="em-product-cancel">Cancel</button>' +
          '<button class="em-product-save">Save Product</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(productOverlay);

    productOverlay.querySelector('.em-product-cancel').addEventListener('click', closeProductModal);
    productOverlay.querySelector('.em-product-save').addEventListener('click', saveProduct);
    productOverlay.addEventListener('click', function (e) {
      if (e.target === productOverlay) closeProductModal();
    });
    document.getElementById('em-add-benefit').addEventListener('click', addBenefitRow);

    return productOverlay;
  }

  function addBenefitRow(value) {
    var list = document.getElementById('em-benefits-list');
    var row = document.createElement('div');
    row.className = 'em-benefit-row';
    row.innerHTML =
      '<input type="text" placeholder="Enter benefit..." value="' + (typeof value === 'string' ? value.replace(/"/g, '&quot;') : '') + '">' +
      '<button class="em-benefit-remove"><i class="fas fa-times"></i></button>';
    row.querySelector('.em-benefit-remove').addEventListener('click', function () {
      row.remove();
    });
    list.appendChild(row);
  }

  function openProductModal(editKey) {
    var modal = createProductModal();
    state.editingProductKey = editKey;

    var titleEl = document.getElementById('em-product-modal-title');
    var benefitsList = document.getElementById('em-benefits-list');
    benefitsList.innerHTML = '';

    if (editKey) {
      // Edit existing product
      titleEl.textContent = 'Edit Product';
      var data = getProductData(editKey);
      if (data) {
        document.getElementById('em-prod-name').value = data.name || '';
        document.getElementById('em-prod-category').value = data.category || '';
        document.getElementById('em-prod-tagline').value = data.tagline || '';
        document.getElementById('em-prod-composition').value = data.composition || '';
        document.getElementById('em-prod-description').value = data.description || '';
        document.getElementById('em-prod-image').value = data.image || '';
        document.getElementById('em-prod-icon').value = data.icon || '';
        if (data.benefits) {
          data.benefits.forEach(function (b) { addBenefitRow(b); });
        }
      }
    } else {
      // Add new
      titleEl.textContent = 'Add New Product';
      document.getElementById('em-prod-name').value = '';
      document.getElementById('em-prod-category').value = '';
      document.getElementById('em-prod-tagline').value = '';
      document.getElementById('em-prod-composition').value = '';
      document.getElementById('em-prod-description').value = '';
      document.getElementById('em-prod-image').value = '';
      document.getElementById('em-prod-icon').value = '💊';
      addBenefitRow('');
    }

    modal.classList.add('active');
  }

  function closeProductModal() {
    if (productOverlay) productOverlay.classList.remove('active');
    state.editingProductKey = null;
  }

  function getProductData(key) {
    var saved = loadFromStorage();
    if (saved.products && saved.products[key]) return saved.products[key];
    if (defaultProductData[key]) return defaultProductData[key];
    return null;
  }

  function saveProduct() {
    var name = document.getElementById('em-prod-name').value.trim();
    var category = document.getElementById('em-prod-category').value.trim();
    var tagline = document.getElementById('em-prod-tagline').value.trim();
    var composition = document.getElementById('em-prod-composition').value.trim();
    var description = document.getElementById('em-prod-description').value.trim();
    var image = document.getElementById('em-prod-image').value.trim();
    var icon = document.getElementById('em-prod-icon').value.trim() || '💊';

    if (!name) {
      showToast('Product name is required!', 'error');
      return;
    }

    var benefits = [];
    var rows = document.querySelectorAll('#em-benefits-list .em-benefit-row input');
    rows.forEach(function (input) {
      var val = input.value.trim();
      if (val) benefits.push(val);
    });

    var key = state.editingProductKey || generateKey(name);

    var productInfo = {
      name: name,
      image: image || 'images/products/default.png',
      category: category,
      tagline: tagline,
      composition: composition,
      description: description,
      benefits: benefits,
      icon: icon
    };

    // Save to localStorage
    var saved = loadFromStorage();
    if (!saved.products) saved.products = {};
    saved.products[key] = productInfo;
    saveToStorage(saved);

    // Update or create card in DOM
    if (state.editingProductKey) {
      updateProductCard(key, productInfo);
    } else {
      createProductCard(key, productInfo);
    }

    // Update the modal data in main.js productData (if accessible)
    updateMainProductData(key, productInfo);

    closeProductModal();
    showToast(state.editingProductKey ? 'Product updated!' : 'Product added!', 'success');

    // Re-setup buttons for new cards
    if (!state.editingProductKey) {
      setupProductButtons();
    }
  }

  function createProductCard(key, data) {
    var grid = document.querySelector('.products-grid');
    if (!grid) return;

    var card = document.createElement('div');
    card.className = 'product-card tilt-card';
    card.setAttribute('data-product', key);
    card.id = 'product-' + key;
    card.innerHTML =
      '<div class="product-card-inner">' +
        '<div class="product-image">' +
          '<img src="' + data.image + '" alt="' + data.name + '" onerror="this.style.display=\'none\'">' +
        '</div>' +
        '<div class="product-info" style="text-align:center;">' +
          '<h3>' + data.name + '</h3>' +
          '<button class="product-btn" data-product="' + key + '">View Details <i class="fas fa-arrow-right"></i></button>' +
        '</div>' +
      '</div>';

    grid.appendChild(card);

    // Attach modal click handler
    var btn = card.querySelector('.product-btn');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openMainModal(key);
    });
  }

  function updateProductCard(key, data) {
    var card = document.querySelector('.product-card[data-product="' + key + '"]');
    if (!card) return;

    var img = card.querySelector('.product-image img');
    if (img) img.src = data.image;

    var h3 = card.querySelector('.product-info h3');
    if (h3) h3.textContent = data.name;
  }

  function updateMainProductData(key, data) {
    // Try to update the productData object in the main JS scope
    // Since it's in an IIFE, we'll attach to window for cross-scope access
    if (!window._hindvaProducts) window._hindvaProducts = {};
    window._hindvaProducts[key] = data;
  }

  function openMainModal(key) {
    var data = getProductData(key);
    if (!data) return;

    var modalOverlay = document.querySelector('.modal-overlay');
    var modalBody = document.getElementById('modal-body');
    if (!modalOverlay || !modalBody) return;

    var benefitsHTML = '';
    if (data.benefits) {
      data.benefits.forEach(function (b) { benefitsHTML += '<li>' + b + '</li>'; });
    }

    modalBody.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:30px;align-items:flex-start;">' +
        '<div style="flex:1 1 250px;text-align:center;">' +
          '<img src="' + data.image + '" alt="' + data.name + '" style="max-width:100%;height:auto;object-fit:contain;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">' +
        '</div>' +
        '<div style="flex:2 1 300px;">' +
          '<div class="modal-header" style="margin-bottom:20px;">' +
            '<span class="modal-icon">' + data.icon + '</span>' +
            '<div><span class="modal-category">' + data.category + '</span>' +
            '<h2 style="margin:0 0 5px 0;">' + data.name + '</h2>' +
            '<p class="modal-tagline" style="margin:0;">' + data.tagline + '</p></div>' +
          '</div>' +
          '<div class="modal-details">' +
            '<div class="modal-composition"><strong>Composition:</strong> ' + data.composition + '</div>' +
            '<p class="modal-description">' + data.description + '</p>' +
            '<h3>Key Benefits</h3>' +
            '<ul class="modal-benefits">' + benefitsHTML + '</ul>' +
          '</div>' +
        '</div>' +
      '</div>';

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /* ───────────────────────────────────────────────────────────────
     7. SAVE / LOAD / RESET (localStorage)
     ─────────────────────────────────────────────────────────────── */
  function saveToStorage(data) {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Edit Mode: Could not save to localStorage', e);
    }
  }

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAllChanges() {
    var data = loadFromStorage();

    // Save all editable text content
    var editables = document.querySelectorAll('[data-editable]');
    if (!data.text) data.text = {};
    editables.forEach(function (el) {
      var key = el.getAttribute('data-editable');
      if (key) {
        data.text[key] = el.innerHTML;
      }
    });

    // Save all editable images
    var editableImgs = document.querySelectorAll('[data-editable-img] img');
    if (!data.images) data.images = {};
    editableImgs.forEach(function (img) {
      var container = img.closest('[data-editable-img]');
      if (container) {
        var key = container.getAttribute('data-editable-img');
        if (key) data.images[key] = img.src;
      }
    });

    saveToStorage(data);
    showToast('All changes saved!', 'success');
  }

  function resetAllChanges() {
    if (!confirm('Reset all changes to original? This cannot be undone.')) return;

    localStorage.removeItem(CONFIG.storageKey);
    showToast('All changes reset! Reloading...', 'info');
    setTimeout(function () {
      location.reload();
    }, 1200);
  }

  function applySavedChanges() {
    var data = loadFromStorage();

    // Apply saved text
    if (data.text) {
      Object.keys(data.text).forEach(function (key) {
        var el = document.querySelector('[data-editable="' + key + '"]');
        if (el) el.innerHTML = data.text[key];
      });
    }

    // Apply saved images
    if (data.images) {
      Object.keys(data.images).forEach(function (key) {
        var container = document.querySelector('[data-editable-img="' + key + '"]');
        if (container) {
          var img = container.querySelector('img');
          if (img) img.src = data.images[key];
        }
      });
    }

    // Apply saved/added products
    if (data.products) {
      Object.keys(data.products).forEach(function (key) {
        var existing = document.querySelector('.product-card[data-product="' + key + '"]');
        if (existing) {
          updateProductCard(key, data.products[key]);
        } else {
          createProductCard(key, data.products[key]);
        }
        updateMainProductData(key, data.products[key]);
      });
    }
  }

  /* ───────────────────────────────────────────────────────────────
     8. INIT
     ─────────────────────────────────────────────────────────────── */
  function init() {
    // Apply any saved changes first
    applySavedChanges();

    // Setup hidden trigger
    initHiddenTrigger();

    // Check if session is still active (tab wasn't closed)
    if (sessionStorage.getItem(CONFIG.sessionKey) === 'true') {
      activateEditMode();
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
