# Updated Charlie PC System Flowchart

This document reflects the current Charlie PC build as of March 27, 2026. It updates the older flowchart view so the diagrams match the actual web app, mobile app, and backend behavior in the latest version.

## What changed in the current version

- Web admin product management now uses a category dropdown and a photo picker instead of a raw image URL field.
- Mobile admin product management also uses category selection and photo picking, with a keyboard-aware scrollable form.
- The mobile cashier experience no longer includes product management. Cashier mobile tabs are limited to counter products, payment, and profile.
- Product creation and updates still pass through the backend, which validates category values and resolves product images before saving.
- The product catalog only returns items that already have photos.
- Receipt generation, stock deduction, and sale recording continue to happen on the backend for both web and mobile.

## 1. Updated system integration flowchart

```mermaid
flowchart LR
    subgraph Presentation["Presentation Layer"]
        Web["Web App<br/>Customer storefront<br/>Cashier POS<br/>Admin dashboard, products, sales"]
        Mobile["Mobile App<br/>Customer shop/cart/profile<br/>Cashier counter/payment/profile<br/>Admin dashboard, products, sales"]
    end

    subgraph Service["Application Layer"]
        API["Express REST API"]
        Auth["Auth Service<br/>/api/login, /api/register, /api/me"]
        Products["Product Service<br/>/products, /products/search"]
        Sales["Sales Service<br/>/sales, /sales/:id"]
        Reports["Report Service<br/>/reports/dashboard"]
        Ref["Reference Service<br/>/reference/ph-addresses"]
    end

    subgraph Data["Data Layer"]
        DB[("SQLite Database")]
        Addr["PH Address Dataset"]
        Backup["Database Backup"]
    end

    Web <--> API
    Mobile <--> API

    API --> Auth
    API --> Products
    API --> Sales
    API --> Reports
    API --> Ref

    Auth <--> DB
    Products <--> DB
    Sales <--> DB
    Reports <--> DB
    Ref <--> Addr
    DB --> Backup
```

### Explanation

- Both clients talk only to the Express backend.
- Authentication, checkout, reporting, and product rules stay centralized.
- Web and mobile do not access SQLite directly.
- The backend remains the single source of truth for users, products, sales, and sale items.

## 2. Updated role-based operating flow

```mermaid
flowchart TD
    A([Start]) --> B["Open Charlie PC on Web or Mobile"]
    B --> C{"Logged in?"}

    C -->|No| D["Open Login or Register Screen"]
    D --> E["Submit credentials to /api/login or /api/register"]
    E --> F{"Role returned by backend"}

    C -->|Yes| F

    F -->|Customer| G["Open customer shopping flow"]
    F -->|Cashier| H["Open cashier selling flow"]
    F -->|Admin| I["Open admin management flow"]

    G --> G1["Browse products and search catalog"]
    G1 --> G2["Add items to cart"]
    G2 --> G3["Choose fulfillment and payment"]
    G3 --> G4["Submit order to /sales"]

    H --> H1["Open POS or mobile counter products"]
    H1 --> H2["Add products to active sale"]
    H2 --> H3["Enter payment details"]
    H3 --> H4["Submit sale to /sales"]

    I --> I1{"Admin task"}
    I1 -->|Dashboard| I2["Read /reports/dashboard"]
    I1 -->|Sales review| I3["Read /sales and sale details"]
    I1 -->|Product management| I4["Create, edit, or delete via /products"]

    G4 --> J["Backend validates token, stock, totals, payment, and address"]
    H4 --> J
    I2 --> K["Return dashboard metrics"]
    I3 --> L["Return sales records and receipt data"]
    I4 --> M["Validate category and product image, then save product"]

    J --> N{"Validation passed?"}
    N -->|No| O["Return error to client"]
    N -->|Yes| P["Create sale, create sale items, deduct stock, generate receipt"]
    P --> Q["Return receipt and updated product data"]

    K --> R([End])
    L --> R
    M --> R
    O --> R
    Q --> R
```

### Explanation

- Customers use the shopping flow.
- Cashiers use the selling flow.
- Admins use dashboard, sales, and product management flows.
- Regardless of the role, the backend is still the point where validation and database writes happen.

## 3. Updated product management flow

This flow reflects the latest add/edit product behavior on both web and mobile admin interfaces.

```mermaid
flowchart TD
    A([Admin opens product form]) --> B["Enter product name"]
    B --> C["Select category from dropdown"]
    C --> D["Enter price and stock"]
    D --> E{"Choose product photo?"}

    E -->|Yes| F["Pick photo from device or camera"]
    E -->|No| G["Use category-based product image"]

    F --> H["Send product payload to /products"]
    G --> H

    H --> I["Backend sanitizes category"]
    I --> J["Backend resolves image to chosen photo or category photo"]
    J --> K["Insert or update product in SQLite"]
    K --> L["Product appears in catalog if photo is present"]
    L --> M([End])
```

### Notes for the current build

- Web admin no longer uses an image URL textbox.
- Mobile admin no longer uses a barcode textfield in the add/edit form.
- Mobile cashier no longer has access to manage products.
- If an admin resets the image, the backend falls back to the category photo.
- Catalog endpoints only return products with non-empty images, which keeps customer and cashier product lists clean.

## 4. Platform behavior summary

### Web

- Customer flow: browse, search, cart, checkout
- Cashier flow: POS-only selling flow
- Admin flow: dashboard, products, sales

### Mobile

- Customer tabs: Shop, Cart, Profile
- Cashier tabs: Counter Products, Payment, Profile
- Admin tabs: Dashboard, Products, Sales, Profile

## 5. Recommended defense explanation

If you need a short verbal explanation during the defense, you can use this:

> Charlie PC uses one shared backend for both web and mobile. Users log in and are routed by role. Customers browse and check out, cashiers process counter sales, and admins manage products, sales, and dashboard reports. All important actions still pass through the same API, which validates data, updates the SQLite database, deducts stock, and returns receipts or reports. In the updated version, product management is cleaner because categories are controlled through dropdown selection and product images are handled through a real photo picker instead of a raw URL field.
