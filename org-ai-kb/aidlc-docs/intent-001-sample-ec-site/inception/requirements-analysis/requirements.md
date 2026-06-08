# Requirements — Sample EC Site

Intent: intent-001-sample-ec-site

## 1. Intent Summary

- **Type:** New feature — greenfield new build (a sample e-commerce site built from scratch).
- **Scope:** Single small web application comprising a frontend and a mock backend. No cross-system or multi-repository concerns.
- **Complexity:** Low / minimal. Four core capabilities only: product listing, product detail, cart, and checkout.
- **Classification:** Greenfield. There is no existing codebase to integrate with and no affected repositories in the RE-kb.
- **Affected repos:** None identified.
- **Overarching constraint:** This is a SAMPLE that must run locally with no external dependencies. The backend returns MOCK / in-memory data only — no real database, no real payment gateway, no external services. This constraint shapes every requirement below and is restated in the Assumptions and NFR sections. (Specific technology, framework, and storage choices are deferred to the construction phase.)

## 2. Functional Requirements

### Product listing

- **FR-1:** The site SHALL display a product listing page showing all available products in the catalogue.
- **FR-2:** Each product in the listing SHALL display its name, price, a single product image, and a short description.
- **FR-3:** Each product entry in the listing SHALL provide a way to navigate to that product's detail page.

### Product detail

- **FR-4:** The site SHALL display a product detail page for a single selected product, showing its name, price, a single product image, and a short description.
- **FR-5:** The product detail page SHALL provide a control to add the product to the cart.

### Cart

- **FR-6:** A user SHALL be able to add a product to the cart from the product listing and/or the product detail page.
- **FR-7:** A user SHALL be able to change the quantity of an item already in the cart.
- **FR-8:** A user SHALL be able to remove an item from the cart.
- **FR-9:** The site SHALL display the cart contents, listing each item with its name, unit price, and quantity, together with the total price of all items in the cart.

### Product availability

- **FR-10:** All products SHALL be orderable at all times; the site SHALL NOT perform any stock or inventory checks and SHALL NOT block adding or ordering any product.

### Checkout

- **FR-11:** The site SHALL provide a checkout flow that captures the customer's name, email, and shipping address.
- **FR-12:** Checkout SHALL be available to a guest user without requiring account creation or login.
- **FR-13:** Checkout SHALL be simulated: the site SHALL NOT process any real payment and SHALL NOT charge the user.

### Place order

- **FR-14:** On placing an order, the site SHALL generate a unique order ID for that order.
- **FR-15:** After an order is placed, the site SHALL display an order confirmation screen showing the generated order ID and the list of ordered items.
- **FR-16:** After an order is successfully placed, the site SHALL empty the cart.
- **FR-17:** If the cart is empty, the site SHALL NOT allow an order to be placed (the place-order action SHALL be unavailable or rejected when no items are in the cart).

## 3. Non-functional Requirements

- **NFR-1:** The application SHALL run locally as a self-contained app, startable on a single developer machine with no external network dependencies and no external services.
- **NFR-2:** The backend SHALL serve only mock / in-memory data; it SHALL NOT depend on a real database, payment gateway, or any external/third-party service.
- **NFR-3:** Usability — a first-time user SHALL be able to complete the full core flow (browse listing → view product detail → add to cart → checkout → place order) without external instructions or documentation.
- **NFR-4:** Each user-facing page interaction (page navigation, viewing listing/detail, cart updates) SHALL render its result in under 1 second under local single-user conditions, since all data is served in-memory.
- **NFR-5:** Cart and order operations SHALL produce a visible response (updated cart, confirmation screen) for every user action so the user always has feedback on the result of the action.

## 4. Assumptions

- **A-1 (assumption):** The application is run locally only; all data is mock / in-memory, with no persistence beyond the current session.
- **A-2 (assumption):** No stock or inventory tracking exists; every product is assumed permanently available.
- **A-3 (assumption):** Checkout is guest-only and simulated; no real payment is processed and no payment details are required or stored.
- **A-4 (assumption):** Product images are placeholder assets, consistent with the mock-data constraint.
- **A-5 (assumption):** Placed orders are held in-memory only and are not persisted beyond the session; they are not retrievable later.
- **A-6 (assumption):** A single set of mock product data is sufficient for the sample; product catalogue management is not required.

## 5. Out of Scope

- User accounts, registration, and login / authentication.
- Real payment processing.
- Order history and order retrieval after the confirmation screen.
- Admin / product management interfaces.
- Search and filtering on the listing page.
- Product reviews and ratings.
- Discounts, coupons, and promotions.
- Shipping cost and tax calculation.
- A real or persistent backend, a real database, and any external / real third-party services (replaced by mock data running locally).
