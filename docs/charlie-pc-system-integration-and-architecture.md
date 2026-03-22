# Charlie PC Web and Mobile System Integration and Architecture Documentation

Prepared for the Charlie PC integrated point-of-sale, customer ordering, and inventory management system.

## Chapter I. Project Overview

### I. Background of the Study

Charlie PC is an integrated retail system designed for a computer parts and accessories shop that serves three main user groups: customers, cashiers, and administrators. The project was developed as a shared platform with one backend service and two client applications:

- a web application for customer ordering, cashier point-of-sale, and admin management
- a mobile application for customer shopping, cashier counter operations, and admin management

The practical need behind the system is common in small and medium retail stores. Many stores still separate customer ordering, cashier checkout, stock monitoring, and sales reporting into disconnected tools or manual records. This causes duplicated product encoding, inconsistent stock levels, and delayed reporting. Charlie PC addresses that problem by centralizing authentication, inventory, sales processing, and reporting in one backend while exposing the same business rules to both web and mobile clients.

The system follows a layered client-server model and exposes REST-style JSON endpoints so that different clients can communicate with the same server logic in a consistent way, which is aligned with network-based architectural principles described by Fielding (2000).

### II. Problem Statement

The study addresses the following problems:

1. Retail operations are harder to manage when customer ordering, cashier checkout, and inventory tracking are handled in separate tools.
2. Product, price, and stock data become inconsistent when web and mobile interfaces do not share a single source of truth.
3. Manual or client-side-only checkout logic can lead to invalid totals, stock mismatches, and weak auditability.
4. Stores need role-based access so that customers, cashiers, and administrators see only the functions appropriate to their responsibilities.
5. Small stores need a practical solution that supports web and mobile access without requiring a complex enterprise database setup.

### III. Objectives

#### General Objective

To design and implement an integrated Charlie PC system that connects web and mobile applications to a shared backend for authentication, product management, checkout, sales recording, and reporting.

#### Specific Objectives

1. To provide a web application that supports customer browsing, online ordering, cashier POS operations, and admin product and sales management.
2. To provide a mobile application that supports customer shopping, cashier counter operations, and admin dashboards, product management, and sales monitoring.
3. To centralize authentication using token-based login so that both web and mobile clients use the same account and authorization rules.
4. To centralize inventory and checkout rules so that sale totals, stock deductions, receipts, and validation are computed on the server.
5. To maintain one consistent database for users, products, sales, and sale items.
6. To support realistic checkout features such as receipts, delivery and pickup selection, PH customer-data validation, and multiple payment methods including Cash, Card, GCash, and Cash on Delivery.
7. To keep the mobile application usable across narrow phones, tablets, and foldable-width layouts through responsive screen composition.

### IV. Scope and Limitations

#### Scope

The Charlie PC system covers the following:

- customer registration and login
- role-based login for customer, cashier, and admin
- product listing, search, and category browsing
- add-to-cart and customer checkout on web and mobile
- cashier POS checkout with quick cash tendering, payment confirmation, and receipt output
- admin product management and sales monitoring on web and mobile
- sales reporting through dashboard metrics
- PH phone, email, and delivery address validation with inline required-field feedback on web and mobile
- receipt generation and inventory deduction
- responsive mobile layouts that adapt for small phones, larger phones, tablets, and foldable-width screens
- shared backend integration for both web and mobile clients

#### Limitations

The current implementation also has clear boundaries:

- the backend uses SQLite, which is practical for a school project or small deployment, but is not intended for large multi-branch concurrency
- card and GCash flows are realistic UI and validation flows, but they are not yet connected to a live payment gateway or webhook-based payment confirmation
- the Philippine address dataset is currently a curated starter dataset, not a complete nationwide PSGC-integrated source
- the mobile cart is stateful during app use but does not yet implement advanced offline sync
- the application includes validation and UI safeguards, but it does not yet use a full automated CI pipeline for every build target
- the system currently runs as a centralized single backend service and is not yet deployed as distributed microservices

## Chapter II. System Architecture

### I. Architectural Style

The Charlie PC system uses a **hybrid client-server, layered 3-tier, REST API-based architecture**.

- **Client-server**: the web app and mobile app act as separate clients that communicate with one backend server.
- **3-tier layering**: the presentation layer is separated from the application logic layer and the data layer.
- **REST API-based integration**: the backend exposes resource-oriented endpoints such as `/api/login`, `/products`, `/sales`, `/reports/dashboard`, and `/reference/ph-addresses`.

This architectural choice fits the system because the same business logic must serve multiple interfaces while keeping pricing, stock, authentication, checkout rules, and product permissions centralized. The REST style is appropriate because it supports independent clients, uniform interfaces, and scalable interaction patterns (Fielding, 2000).

```mermaid
cat > flowchart.mmd <<'EOF'
flowchart LR
    subgraph Presentation["Presentation Layer"]
        Web["Web Application\nReact + Vite"]
        Mobile["Mobile Application\nExpo + React Native"]
    end

    subgraph Services["Application / Service Layer"]
        API["Express REST API"]
        Auth["JWT Authentication\nand Role Middleware"]
        Product["Product Service"]
        Sale["Sales and Checkout Service"]
        Report["Reporting Service"]
        Ref["Reference Data Service"]
    end

    subgraph Data["Data Layer"]
        DB[("SQLite Database")]
        Addr["PH Address Reference Data"]
        Backup["Automatic Database Backup"]
    end

    Web <--> |HTTPS + JSON| API
    Mobile <--> |HTTPS + JSON| API

    API --> Auth
    API --> Product
    API --> Sale
    API --> Report
    API --> Ref

    Product <--> DB
    Sale <--> DB
    Report <--> DB
    Auth <--> DB
    Ref <--> Addr
    DB --> Backup
EOF
```

**Brief explanation.**  
The web and mobile clients never access the database directly. Instead, both clients send JSON requests to the Express backend. The backend authenticates users using JWT, applies role checks, executes sale and product rules, then stores and retrieves data from SQLite. This design keeps the business rules consistent across both platforms.

### II. Flowchart

The following flowchart shows the main end-to-end operating flow of the system across web and mobile.

```mermaid
cat > flowchart_td.mmd <<'EOF'
flowchart TD
    A([Start]) --> B["Open Charlie PC on Web or Mobile"]
    B --> C{"User Role?"}

    C -->|Customer| D["Browse Products"]
    C -->|Cashier| E["Login as Cashier"]
    C -->|Admin| F["Login as Admin"]

    D --> G{"Add to Cart / Checkout?"}
    G -->|No| D
    G -->|Yes| H{"Logged in as Customer?"}
    H -->|No| I["Prompt Login"]
    I --> J["Authenticate via /api/login"]
    J --> H
    H -->|Yes| K["Enter Fulfillment, Payment, and Address Details"]
    K --> L["Send Sale Request to /sales"]

    E --> M["Open POS Counter Interface"]
    M --> N["Add Products to Sale"]
    N --> O["Enter Payment Details"]
    O --> L

    F --> P["Open Admin Dashboard"]
    P --> Q{"Task Type?"}
    Q -->|Manage Products| R["Create / Update / Delete Product"]
    Q -->|Review Sales| S["View Dashboard and Sales Data"]
    R --> T["Send Request to /products"]
    S --> U["Read /reports and /sales data"]

    L --> V["Backend Validates Token, Role, Stock, Totals, Payment, and Address"]
    V --> W{"Validation Passed?"}
    W -->|No| X["Return Error to Client"]
    W -->|Yes| Y["Store Sale, Store Sale Items, Deduct Stock, Generate Receipt"]
    Y --> Z["Return Receipt / Updated Data"]
    Z --> AA([End])
    T --> AA
    U --> AA
    X --> AA
EOF
```

**Brief explanation.**  
The flow differs by role, but all important transactions still converge at the same backend. Customer checkout, cashier payment processing, admin product management, and report retrieval all pass through the shared API. This prevents logic duplication between the web and mobile apps.

### III. Data Flow Diagram

The following DFD-level view shows how external users, client applications, services, and data stores interact.

```mermaid
cat > flowchart_lr.mmd <<'EOF'
flowchart LR
    Customer["External Entity:\nCustomer"]
    Staff["External Entity:\nCashier / Admin"]

    Web["Process:\nWeb Client"]
    Mobile["Process:\nMobile Client"]
    Backend["Process:\nCharlie PC Backend API"]

    Users[("Data Store:\nUsers")]
    Products[("Data Store:\nProducts")]
    Sales[("Data Store:\nSales")]
    SaleItems[("Data Store:\nSale Items")]
    AddressRef[("Data Store:\nPH Address Reference")]

    Customer -->|"login, browse, cart, checkout"| Web
    Customer -->|"login, browse, cart, checkout"| Mobile
    Staff -->|"login, POS, product updates, report requests"| Web
    Staff -->|"login, POS, product updates, report requests"| Mobile

    Web -->|"JSON requests"| Backend
    Mobile -->|"JSON requests"| Backend

    Backend <--> Users
    Backend <--> Products
    Backend <--> Sales
    Backend <--> SaleItems
    Backend <--> AddressRef

    Backend -->|"tokens, product lists, receipts,\nvalidation results, reports"| Web
    Backend -->|"tokens, product lists, receipts,\nvalidation results, reports"| Mobile
EOF
```

**Brief explanation.**  
Users interact only with the web or mobile client. Both clients forward requests to the backend API, which becomes the integration hub. The API reads and writes to the system data stores and returns the results to the clients. This is the central reason why the web and mobile versions stay synchronized.

### IV. Entity Relationship Diagram

The Charlie PC database uses four core relational entities for operational data.

```mermaid
cat > erdiagram.mmd <<'EOF'
erDiagram
    USERS ||--o{ SALES : records
    SALES ||--|{ SALE_ITEMS : contains
    PRODUCTS ||--o{ SALE_ITEMS : referenced_by

    USERS {
        int id PK
        string name
        string email
        string password
        string role
    }

    PRODUCTS {
        int id PK
        string name
        string category
        float price
        int stock
        string barcode
        string image
    }

    SALES {
        int id PK
        float total
        float subtotal
        string paymentMethod
        string receipt_number
        string createdAt
        int user_id FK
        string discount_type
        float discount_value
        float discount_amount
        float tax_rate
        float tax_amount
        float amount_tendered
        float change_amount
        string status
        string sale_channel
        string voidedAt
        string fulfillment_type
        string customer_name
        string customer_phone
        string customer_email
        string delivery_address
        string payment_reference
        string payment_last4
    }

    SALE_ITEMS {
        int id PK
        int sale_id FK
        int product_id FK
        string product_name
        int quantity
        float price
        float line_total
    }
EOF
```

**Brief explanation.**  
`USERS` stores role-based accounts. `PRODUCTS` stores the inventory catalog. `SALES` stores receipt-level transaction data, including payment, fulfillment, customer, and audit metadata. `SALE_ITEMS` stores the line items of each transaction. This structure allows one sale to contain many items and allows reports to be generated from normalized transactional records while preserving receipt snapshots even when product records later change.

## Chapter III. System Integration and Design

### I. Integration Strategy

The Charlie PC system integrates the web and mobile applications through a **shared backend API** and **token-based authentication**.

#### 1. Shared backend API

Both clients consume the same backend endpoints:

- `/api/login` and `/api/register` for authentication
- `/products` and `/products/search` for product retrieval and product management
- `/sales` for checkout and sales retrieval
- `/reports/dashboard` for admin reporting
- `/reference/ph-addresses` for structured delivery address selection

This matches Express’s modular router approach, where endpoints are mounted as route modules and used as mini-applications inside one server (Express.js, n.d.).

#### 2. Token-based authentication

After login, the backend returns a JWT that contains the authenticated user ID and role. The token is then sent back in the `Authorization: Bearer <token>` header for protected requests. This is consistent with JWT’s purpose as a compact claims representation for secure client-server communication (Jones et al., 2015).

- Web storage: `localStorage`
- Mobile storage: `AsyncStorage`

#### 3. Shared business rules

Integration is not limited to shared endpoints. The critical business rules are also centralized on the backend:

- customer checkout is allowed only for authenticated customer accounts
- POS checkout is allowed only for admin or cashier accounts
- product creation is restricted to authenticated admin or cashier users
- product update and deletion are admin-only operations
- totals, discounts, tax, stock checks, receipt numbers, and sale items are computed server-side
- PH email and phone validation rules are applied before checkout data is accepted
- delivery checkout requires a structured address and Cash on Delivery is limited to delivery orders
- GCash requires a payment reference and card payments preserve only masked last-four metadata
- voiding restocks items and marks the sale as `voided` instead of silently deleting the transaction

This means the mobile app and web app do not independently decide sale totals or stock changes. They submit requests, and the backend becomes the source of truth.

#### 4. Shared JSON data exchange

Both clients exchange data with the backend as JSON payloads. This includes:

- login credentials and token responses
- product catalogs
- checkout payloads
- dashboard summaries
- receipts and sales details

This integration style is simple, maintainable, and appropriate for a project that supports multiple clients without duplicating backend logic.

#### 5. Shared validation and reference-data flow

The integration also includes structured validation and reference data rather than plain free-text checkout:

- web and mobile checkout forms both validate required fields and visually mark missing entries
- Philippine phone numbers and email addresses are validated in the client and enforced again on the backend
- delivery addresses follow a hierarchical reference flow: `Region -> Province -> Municipality/City -> Barangay -> Postal Code`
- the composed delivery address sent to the backend also includes street or building details and landmark information

This is important architecturally because the user interface can guide the user, but the backend still enforces the same acceptance rules.

### II. Database Integration

The system uses **SQLite** as the operational database.

#### Why SQLite was used

SQLite is suitable for this project because it is:

- ACID-compliant
- zero-configuration
- stored in a single file
- lightweight and easy to deploy for student and small-business systems

These characteristics are specifically described in the official SQLite feature documentation (SQLite, 2025).

#### How the database is integrated

1. The Express backend initializes and migrates the database on startup.
2. Both the web and mobile applications communicate only with the backend, not directly with SQLite.
3. Tables for `users`, `products`, `sales`, and `sale_items` support the core transaction flow.
4. The sale creation process runs inside a transaction so that stock deduction, receipt creation, and sale item insertion happen atomically.
5. The system automatically creates timestamped SQLite backup files during startup for data protection.

#### Database behavior in the implemented system

The database integration directly supports the actual Charlie PC features:

- shared product data between customer storefronts and cashier/admin views
- receipt-based transaction recording
- inventory deduction after successful checkout
- reporting based on stored sales and sale items
- audit-friendly voiding by restocking items and marking the sale as `voided` instead of deleting it

#### Observed design trade-off

SQLite is practical and efficient for a school capstone or a single-store deployment, but it is not the best long-term choice for:

- very high write concurrency
- multi-branch cloud deployments
- large analytics workloads

If Charlie PC is scaled beyond a single-store or demo context, a future migration to PostgreSQL or MySQL would be a sensible next step.

### III. Technology Stack

#### Web Application

The web application is built primarily with:

- **React** for component-based user interface development (React, n.d.)
- **Vite** for fast local development and optimized production builds (Vite, n.d.)
- **Fetch API** for REST communication with the backend
- **Custom CSS and Material-inspired styling** for customer, cashier, and admin interfaces

#### Web modules implemented in the system

- customer storefront with cart and checkout
- cashier POS page
- admin dashboard
- admin product management
- sales history and receipt views
- login and registration

The web client acts as the main browser-based interface of the system and uses route/state logic to switch between customer, cashier, and admin experiences.

#### Mobile Application

The mobile application is built with:

- **Expo SDK 54** as the mobile development platform (Expo, n.d.)
- **React Native** for the cross-platform native mobile interface (React Native, 2024)
- **React Navigation** for stack and tab-based navigation management (React Navigation, n.d.)
- **React Native Paper** for Material Design 3-style components
- **AsyncStorage** for local authentication persistence

#### Mobile modules implemented in the system

- customer shop screen
- customer cart and checkout screen
- profile screen
- cashier counter screen with tendering controls
- admin dashboard screen
- admin product management screen
- admin sales screen
- role-based tab navigation for customer, cashier, and admin users
- shared responsive shell for consistent layout and foldable-width support

The mobile app mirrors the backend behavior of the web system rather than acting as a separate system. It consumes the same API, uses the same token model, and works with the same product, sales, and user records. Its screen composition was also updated to adapt across narrow phones, wider phones, tablets, and foldable-style widths by switching spacing, column count, and card layout based on available width.

#### Backend

The backend uses:

- **Node.js** runtime
- **Express** for HTTP routing and middleware (Express.js, n.d.)
- **jsonwebtoken** for JWT authentication based on RFC 7519 (Jones et al., 2015)
- **bcrypt** for password hashing
- **SQLite** for persistent storage (SQLite, 2025)

#### Backend responsibilities in the actual implementation

- route handling
- request validation
- role-based authorization
- product CRUD
- sales processing
- stock deduction
- receipt generation
- reporting
- address reference delivery data
- startup data reconciliation and seeded demo accounts

#### Quality-control support in the implementation

Beyond runtime features, the mobile codebase includes a small static guard script that checks for invalid `react-native-paper` action usage that can cause runtime crashes. This is a practical example of implementation-level quality control: the system architecture is not only about functional modules, but also about preventing repeated UI integration errors in shared component patterns.

## Chapter IV. Summary, Conclusion, and Recommendations

### Summary

The Charlie PC project successfully integrates a web application and a mobile application using one shared backend and one shared database. The system supports customer shopping, cashier POS operations, and admin management through a consistent role-based model. The architecture is best described as a layered client-server system with REST-style API communication. This design allowed the project to reuse backend logic across both clients, keep critical business rules centralized, and maintain a common user experience across web, phone-sized mobile screens, and wider mobile layouts.

### Conclusion

Based on the implemented structure of the project, the chosen architecture is appropriate for the system requirements. The integration strategy is realistic because:

- both clients use the same API
- authentication is centralized using JWT
- inventory and checkout rules are computed on the backend
- product, sales, and reporting data remain synchronized across platforms
- validation rules for customer data, delivery details, and payment flows are enforced consistently across interfaces
- the mobile application is responsive enough for demonstration on different device widths, including foldable-width layouts

Therefore, the Charlie PC system demonstrates a practical implementation of web-mobile integration for a retail environment. It is suitable for academic demonstration, prototype deployment, and small store operations.

### Recommendations

To improve the next version of the system, the following are recommended:

1. Integrate a real payment gateway for card and GCash processing.
2. Replace the curated address dataset with a complete, authoritative Philippine administrative dataset.
3. Add refresh-token or session-hardening support for stronger authentication lifecycle management.
4. Add persistent cart synchronization across sessions and devices.
5. Introduce automated CI validation that runs web build checks, mobile guard checks, and backend tests together.
6. Migrate to a server-grade database if the project is expanded into a multi-branch deployment.
7. Add barcode scanning, supplier modules, and purchase-order management for a more complete retail workflow.

## Appendix A. Implementation Alignment

The documentation above reflects the current implementation of the Charlie PC system in the following core files:

- Web entry and role flow: `frontend/src/App.jsx`
- Web customer storefront: `frontend/src/components/CustomerApp.jsx`
- Web cashier POS: `frontend/src/components/POS.jsx`
- Web admin pages: `frontend/src/components/Dashboard.jsx`, `frontend/src/components/ProductsPage.jsx`, `frontend/src/components/SalesPage.jsx`
- Web shared auth role definitions: `frontend/src/constants/authRoles.js`
- Mobile app root: `mobile/App.js`
- Mobile navigation: `mobile/src/navigation/AppNavigator.js`
- Mobile shared auth styles: `mobile/src/styles/authStyles.js`
- Mobile shared role definitions: `mobile/src/constants/authRoles.js`
- Mobile customer checkout: `mobile/src/screens/CartScreen.js`
- Mobile customer product view: `mobile/src/screens/ProductsScreen.js`
- Mobile shared responsive shell: `mobile/src/styles/screenShell.js`
- Mobile UI guard script: `mobile/scripts/check-paper-actions.js`
- Backend API startup: `backend/server.js`
- Backend auth routes: `backend/routes/authRoutes.js`
- Backend product routes: `backend/routes/productRoutes.js`
- Backend sale routes: `backend/routes/saleRoutes.js`
- Backend reporting routes: `backend/routes/reportRoutes.js`
- Backend auth middleware: `backend/middleware/authMiddleware.js`
- Backend sale logic: `backend/models/saleModel.js`
- Backend database schema and migration logic: `backend/config/database.js`

## References

Expo. (n.d.). *Expo documentation*. Retrieved March 16, 2026, from https://docs.expo.dev/

Express.js. (n.d.). *Express routing*. Retrieved March 16, 2026, from https://expressjs.com/en/guide/routing.html

Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* (Doctoral dissertation, University of California, Irvine). https://roy.gbiv.com/pubs/dissertation/top.htm

Jones, M., Bradley, J., & Sakimura, N. (2015, May). *RFC 7519: JSON Web Token (JWT)*. RFC Editor. https://www.rfc-editor.org/rfc/rfc7519

React. (n.d.). *React*. Retrieved March 16, 2026, from https://react.dev/

React Navigation. (n.d.). *NavigationContainer*. Retrieved March 16, 2026, from https://reactnavigation.org/docs/navigation-container/

React Native. (2024, October 15). *Architecture overview*. https://reactnative.dev/architecture/overview

SQLite. (2025, November 13). *Features of SQLite*. https://www.sqlite.org/features.html

Vite. (n.d.). *Getting started*. Retrieved March 16, 2026, from https://vite.dev/guide/
