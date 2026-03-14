export const authRoleOptions = [
  {
    value: 'customer',
    label: 'Customer',
    copy: 'Shop parts, compare options, and place orders for pickup or delivery.',
    meta: 'Storefront access',
    setup: 'Create a customer account to save your details and check out faster on web or mobile.'
  },
  {
    value: 'cashier',
    label: 'Cashier',
    copy: 'Handle counter sales, process payments, and support walk-in customers quickly.',
    meta: 'Counter sales access',
    setup: 'Create a cashier account for fast in-store checkout and product handling at the counter.'
  },
  {
    value: 'admin',
    label: 'Admin',
    copy: 'Manage products, monitor stock, review sales, and oversee Charlie PC operations.',
    meta: 'Management access',
    setup: 'Create an admin account to access dashboard metrics, product management, and sales records.'
  }
];
