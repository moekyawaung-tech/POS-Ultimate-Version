```javascript
if (localStorage.getItem("posLoggedIn") !== "true") {
  if (!window.location.pathname.includes("login.html")) {
    window.location.href = "login.html";
  }
}

let products = JSON.parse(localStorage.getItem("ultimateProducts")) || [
  { id: 1, code: "P001", name_en: "Coffee Mix", name_mm: "ကော်ဖီမစ်", category_en: "Drink", category_mm: "အဖျော်ယမကာ", price: 1200, stock: 20 },
  { id: 2, code: "P002", name_en: "Shampoo", name_mm: "ခေါင်းလျှော်ရည်", category_en: "Care", category_mm: "ကိုယ်ပိုင်အသုံးအဆောင်", price: 3500, stock: 10 }
];

let cart = JSON.parse(localStorage.getItem("ultimateCart")) || [];
let currentLanguage = localStorage.getItem("ultimateLang") || "en";
let currentCurrency = localStorage.getItem("ultimateCurrency") || "MMK";
let report = JSON.parse(localStorage.getItem("ultimateReport")) || {
  totalSales: 0,
  totalOrders: 0,
  itemsSold: 0,
  salesHistory: []
};

const TAX_RATE = 0.05;
const BAHT_RATE = 75;
let salesChart;

const productGrid = document.getElementById("productGrid");
const cartList = document.getElementById("cartList");
const searchInput = document.getElementById("searchInput");
const currencySelect = document.getElementById("currencySelect");
const langToggle = document.getElementById("langToggle");
const discountInput = document.getElementById("discountInput");
const cashInput = document.getElementById("cashInput");

function saveAll() {
  localStorage.setItem("ultimateProducts", JSON.stringify(products));
  localStorage.setItem("ultimateCart", JSON.stringify(cart));
  localStorage.setItem("ultimateLang", currentLanguage);
  localStorage.setItem("ultimateCurrency", currentCurrency);
  localStorage.setItem("ultimateReport", JSON.stringify(report));
}

function t(en, mm) {
  return currentLanguage === "en" ? en : mm;
}

function formatCurrency(value) {
  if (currentCurrency === "BAHT") {
    return "฿ " + new Intl.NumberFormat("en-US").format(value / BAHT_RATE);
  }
  return "MMK " + new Intl.NumberFormat("en-US").format(value);
}

function getSubtotal() {
  return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
}

function getDiscount() {
  return Number(discountInput.value) || 0;
}

function getTax(subtotal, discount) {
  return Math.max(subtotal - discount, 0) * TAX_RATE;
}

function getTotal() {
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const tax = getTax(subtotal, discount);
  return Math.max(subtotal - discount, 0) + tax;
}

function updateTexts() {
  document.getElementById("title").textContent = t("POS Ultimate System", "POS Ultimate စနစ်");
  document.getElementById("subtitle").textContent = t("Mini Market & Shop Management", "မီနီမားကတ်နှင့် စတိုးစီမံခန့်ခွဲမှု");
  document.getElementById("salesLabel").textContent = t("Sales", "အရောင်း");
  document.getElementById("stockLabel").textContent = t("Stock", "လက်ကျန်");
  document.getElementById("ordersLabel").textContent = t("Orders", "အော်ဒါ");
  document.getElementById("itemsLabel").textContent = t("Items Sold", "ရောင်းပြီးပစ္စည်း");
  document.getElementById("adminTitle").textContent = t("Admin Product Management", "Admin Product Management");
  document.getElementById("productsTitle").textContent = t("Products", "ကုန်ပစ္စည်းများ");
  document.getElementById("chartTitle").textContent = t("Sales Chart", "အရောင်း Chart");
  document.getElementById("cartTitle").textContent = t("Cart", "Cart");
  document.getElementById("subtotalLabel").textContent = t("Subtotal", "စုစုပေါင်း");
  document.getElementById("discountLabel").textContent = t("Discount", "လျှော့ဈေး");
  document.getElementById("taxLabel").textContent = t("Tax (5%)", "အခွန် (5%)");
  document.getElementById("totalLabel").textContent = t("Total", "နောက်ဆုံးစုစုပေါင်း");
  document.getElementById("changeLabel").textContent = t("Change", "အမ်းငွေ");
  document.getElementById("clearCartBtn").textContent = t("Clear Cart", "Cart ဖျက်ရန်");
  document.getElementById("checkoutBtn").textContent = t("Checkout", "ငွေချေရန်");
  document.getElementById("reportTitle").textContent = t("Sales Report", "အရောင်း Report");
  document.getElementById("reportSalesLabel").textContent = t("Total Sales", "စုစုပေါင်းအရောင်း");
  document.getElementById("reportOrdersLabel").textContent = t("Total Orders", "စုစုပေါင်းအော်ဒါ");
  document.getElementById("reportItemsLabel").textContent = t("Items Sold", "ရောင်းပြီးပစ္စည်း");
  document.getElementById("receiptTitle").textContent = t("Receipt", "ဘောင်ချာ");
  document.getElementById("receiptSubtotalLabel").textContent = t("Subtotal", "စုစုပေါင်း");
  document.getElementById("receiptDiscountLabel").textContent = t("Discount", "လျှော့ဈေး");
  document.getElementById("receiptTaxLabel").textContent = t("Tax", "အခွန်");
  document.getElementById("receiptCashLabel").textContent = t("Cash", "ပေးငွေ");
  document.getElementById("receiptChangeLabel").textContent = t("Change", "အမ်းငွေ");
  document.getElementById("receiptTotalLabel").textContent = t("Total", "နောက်ဆုံးစုစုပေါင်း");
  document.getElementById("printBtn").textContent = t("Print Receipt", "ဘောင်ချာ Print ထုတ်ရန်");
  document.getElementById("saveProductBtn").textContent = t("Save Product", "Product သိမ်းရန်");
  document.getElementById("logoutBtn").textContent = t("Logout", "ထွက်ရန်");
  document.getElementById("exportCsvBtn").textContent = t("Export CSV", "CSV ထုတ်ရန်");

  searchInput.placeholder = t("Search product...", "ပစ္စည်းရှာရန်...");
  discountInput.placeholder = t("Discount amount", "လျှော့ဈေးပမာဏ");
  cashInput.placeholder = t("Cash received", "ပေးငွေ");
  langToggle.textContent = currentLanguage === "en" ? "မြန်မာ" : "English";
}

function renderProducts(list = products) {
  productGrid.innerHTML = "";
  list.forEach(product => {
    const name = t(product.name_en, product.name_mm);
    const category = t(product.category_en, product.category_mm);

    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <h3>${name}</h3>
      <p>${product.code} • ${category}</p>
      <div class="product-price">${formatCurrency(product.price)}</div>
      <p>${t("Stock", "လက်ကျန်")}: ${product.stock}</p>
      <div class="product-actions">
        <button class="btn primary" onclick="addToCart(${product.id})">${t("Add", "ထည့်ရန်")}</button>
        <button class="btn secondary" onclick="editProduct(${product.id})">${t("Edit", "ပြင်ရန်")}</button>
        <button class="btn secondary" onclick="deleteProduct(${product.id})">${t("Delete", "ဖျက်ရန်")}</button>
      </div>
    `;
    productGrid.appendChild(div);
  });
}

function renderCart() {
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = `<div class="cart-item">${t("Cart is empty.", "Cart ထဲတွင် ပစ္စည်းမရှိပါ။")}</div>`;
  } else {
    cart.forEach(item => {
      const name = t(item.name_en, item.name_mm);
      const total = item.qty * item.price;
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <strong>${name}</strong>
        <p>${item.qty} x ${formatCurrency(item.price)} = ${formatCurrency(total)}</p>
        <div class="product-actions">
          <button class="btn secondary" onclick="decreaseQty(${item.id})">-</button>
          <button class="btn secondary" onclick="increaseQty(${item.id})">+</button>
          <button class="btn secondary" onclick="removeItem(${item.id})">${t("Remove", "ဖျက်ရန်")}</button>
        </div>
      `;
      cartList.appendChild(div);
    });
  }

  updateCartSummary();
  renderReceipt();
  updateDashboard();
  saveAll();
}

function updateCartSummary() {
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const tax = getTax(subtotal, discount);
  const total = getTotal();
  const cash = Number(cashInput.value) || 0;
  const change = cash - total;

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("discountValue").textContent = formatCurrency(discount);
  document.getElementById("tax").textContent = formatCurrency(tax);
  document.getElementById("total").textContent = formatCurrency(total);
  document.getElementById("changeAmount").textContent = formatCurrency(change > 0 ? change : 0);
}

function renderReceipt() {
  const receiptItems = document.getElementById("receiptItems");
  receiptItems.innerHTML = "";

  cart.forEach(item => {
    const name = t(item.name_en, item.name_mm);
    const row = document.createElement("p");
    row.innerHTML = `${name} x ${item.qty} = <strong>${formatCurrency(item.qty * item.price)}</strong>`;
    receiptItems.appendChild(row);
  });

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const tax = getTax(subtotal, discount);
  const total = getTotal();
  const cash = Number(cashInput.value) || 0;
  const change = cash - total;

  document.getElementById("receiptSubtotal").textContent = formatCurrency(subtotal);
  document.getElementById("receiptDiscount").textContent = formatCurrency(discount);
  document.getElementById("receiptTax").textContent = formatCurrency(tax);
  document.getElementById("receiptCash").textContent = formatCurrency(cash);
  document.getElementById("receiptChange").textContent = formatCurrency(change > 0 ? change : 0);
  document.getElementById("receiptTotal").textContent = formatCurrency(total);
}

function updateDashboard() {
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  document.getElementById("dashboardSales").textContent = formatCurrency(report.totalSales);
  document.getElementById("dashboardStock").textContent = totalStock;
  document.getElementById("dashboardOrders").textContent = report.totalOrders;
  document.getElementById("dashboardItems").textContent = report.itemsSold;

  document.getElementById("reportSales").textContent = formatCurrency(report.totalSales);
  document.getElementById("reportOrders").textContent = report.totalOrders;
  document.getElementById("reportItems").textContent = report.itemsSold;

  renderChart();
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || product.stock <= 0) return;

  product.stock -= 1;
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });

  saveAll();
  renderProducts();
  renderCart();
}

function increaseQty(id) {
  const product = products.find(p => p.id === id);
  const item = cart.find(i => i.id === id);
  if (!product || !item || product.stock <= 0) return;

  product.stock -= 1;
  item.qty += 1;

  saveAll();
  renderProducts();
  renderCart();
}

function decreaseQty(id) {
  const product = products.find(p => p.id === id);
  const item = cart.find(i => i.id === id);
  if (!product || !item) return;

  item.qty -= 1;
  product.stock += 1;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);

  saveAll();
  renderProducts();
  renderCart();
}

function removeItem(id) {
  const product = products.find(p => p.id === id);
  const item = cart.find(i => i.id === id);
  if (!product || !item) return;

  product.stock += item.qty;
  cart = cart.filter(i => i.id !== id);

  saveAll();
  renderProducts();
  renderCart();
}

function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById("productId").value = product.id;
  document.getElementById("code").value = product.code;
  document.getElementById("nameEn").value = product.name_en;
  document.getElementById("nameMm").value = product.name_mm;
  document.getElementById("categoryEn").value = product.category_en;
  document.getElementById("categoryMm").value = product.category_mm;
  document.getElementById("price").value = product.price;
  document.getElementById("stock").value = product.stock;
}

function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  cart = cart.filter(c => c.id !== id);
  saveAll();
  renderProducts();
  renderCart();
}

document.getElementById("productForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const id = document.getElementById("productId").value;
  const productData = {
    id: id ? Number(id) : Date.now(),
    code: document.getElementById("code").value,
    name_en: document.getElementById("nameEn").value,
    name_mm: document.getElementById("nameMm").value,
    category_en: document.getElementById("categoryEn").value,
    category_mm: document.getElementById("categoryMm").value,
    price: Number(document.getElementById("price").value),
    stock: Number(document.getElementById("stock").value)
  };

  if (id) {
    products = products.map(p => p.id === Number(id) ? productData : p);
  } else {
    products.push(productData);
  }

  this.reset();
  document.getElementById("productId").value = "";
  saveAll();
  renderProducts();
});

document.getElementById("clearCartBtn").addEventListener("click", () => {
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) product.stock += item.qty;
  });
  cart = [];
  renderProducts();
  renderCart();
});

document.getElementById("checkoutBtn").addEventListener("click", () => {
  const total = getTotal();
  const items = cart.reduce((sum, item) => sum + item.qty, 0);
  const cash = Number(cashInput.value) || 0;

  if (cash < total) {
    alert(t("Not enough cash.", "ပေးငွေမလုံလောက်ပါ။"));
    return;
  }

  report.totalSales += total;
  report.totalOrders += 1;
  report.itemsSold += items;
  report.salesHistory.push({
    date: new Date().toLocaleDateString(),
    total: total
  });

  cart = [];
  discountInput.value = "";
  cashInput.value = "";

  saveAll();
  renderProducts();
  renderCart();
  updateDashboard();

  alert(t("Checkout completed.", "ငွေချေမှုအောင်မြင်ပါသည်။"));
});

document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("posLoggedIn");
  window.location.href = "login.html";
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  let csv = "Date,Total Sales\n";
  report.salesHistory.forEach(item => {
    csv += `${item.date},${item.total}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sales-report.csv";
  a.click();
  URL.revokeObjectURL(url);
});

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase().trim();
  const filtered = products.filter(product =>
    product.code.toLowerCase().includes(keyword) ||
    product.name_en.toLowerCase().includes(keyword) ||
    product.name_mm.toLowerCase().includes(keyword)
  );
  renderProducts(filtered);
});

langToggle.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "mm" : "en";
  updateTexts();
  renderProducts();
  renderCart();
  updateDashboard();
  saveAll();
});

currencySelect.addEventListener("change", (e) => {
  currentCurrency = e.target.value;
  renderProducts();
  renderCart();
  updateDashboard();
  saveAll();
});

discountInput.addEventListener("input", () => {
  updateCartSummary();
  renderReceipt();
});

cashInput.addEventListener("input", () => {
  updateCartSummary();
  renderReceipt();
});

function renderChart() {
  const ctx = document.getElementById("salesChart");
  if (!ctx) return;

  const labels = report.salesHistory.map(item => item.date);
  const data = report.salesHistory.map(item => item.total);

  if (salesChart) salesChart.destroy();

  salesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Sales",
        data: data,
        backgroundColor: "#ff7a00"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      }
    }
  });
}

currencySelect.value = currentCurrency;
updateTexts();
renderProducts();
renderCart();
updateDashboard();
```
